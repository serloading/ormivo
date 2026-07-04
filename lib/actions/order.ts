"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

const CARGO_FEE = 200;

export type OrderItem = {
  productId?: string;
  productName: string;
  price: number;
  quantity: number;
};

export type OrderFormData = {
  customerId: string;
  items: OrderItem[];
  total: number;
  discount?: number;
  shippingFee?: number | null;
  note?: string;
  status?: string;
  deliveryMethod?: string;
  orderDate?: string; // ISO date string, overrides createdAt
};

export async function getOrders() {
  return prisma.order.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrder(data: OrderFormData) {
  await requireAdmin();
  const orderNo = `ORV-${Date.now()}`;
  const order = await prisma.order.create({
    data: {
      orderNo,
      customerId: data.customerId,
      items: data.items as never,
      total: data.total,
      shippingFee: data.shippingFee ?? null,
      note: data.note,
      status: (data.status ?? "PENDING") as never,
      paymentStatus: (data.total === 0 ? "FREE" : "PENDING") as never,
      deliveryMethod: data.deliveryMethod ?? "PICKUP",
      ...(data.orderDate ? { createdAt: new Date(data.orderDate) } : {}),
    },
  });

  // Deduct stock for products with known productId
  const itemsWithProduct = data.items.filter((i) => i.productId);
  for (const item of itemsWithProduct) {
    await prisma.product.update({
      where: { id: item.productId },
      data:  { stock: { decrement: item.quantity } },
    });
  }

  // Ürün maliyeti giderleri hemen kayıt
  const productIds = itemsWithProduct.map((i) => i.productId!);
  if (productIds.length > 0) {
    const [productCosts, usdRateRow] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, costPriceUsd: true },
      }),
      prisma.setting.findUnique({ where: { key: "usd_rate" } }),
    ]);
    const usdRate = usdRateRow ? parseFloat(usdRateRow.value) : 38;
    for (const item of itemsWithProduct) {
      const prod = productCosts.find((p) => p.id === item.productId);
      if (!prod?.costPriceUsd) continue;
      const cost = Math.round(Number(prod.costPriceUsd) * usdRate) * item.quantity;
      await prisma.finance.create({
        data: {
          type:        "EXPENSE",
          amount:      cost,
          description: `Ürün maliyeti — ${item.productName} — #${order.orderNo}`,
          category:    "Ürün Maliyeti",
        },
      });
    }
  }

  // Kargo gideri — kargo ile gönderilecekse
  if ((data.deliveryMethod ?? "PICKUP") === "CARGO") {
    await prisma.finance.create({
      data: {
        type:        "EXPENSE",
        amount:      CARGO_FEE,
        description: `Kargo — Sipariş #${order.orderNo}`,
        category:    "Kargo Gideri",
      },
    });
  }

  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/finans");
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/musteriler");
  return { success: true, id: order.id, orderNo: order.orderNo };
}

export async function updateOrderStatus(
  id: string,
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED"
) {
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/musteriler");
  return { success: true };
}

export async function deleteOrder(id: string) {
  await prisma.order.delete({ where: { id } });
  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/musteriler");
  return { success: true };
}
