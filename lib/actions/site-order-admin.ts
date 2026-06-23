"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const CARGO_FEE = 200;

export async function updateTrackingNo(
  orderId:      string,
  trackingNo:   string,
  cargoCompany: string,
) {
  await prisma.siteOrder.update({
    where: { id: orderId },
    data: {
      trackingNo:   trackingNo.trim()   || null,
      cargoCompany: cargoCompany.trim() || null,
      status:       trackingNo.trim()   ? "SHIPPED" : undefined,
    },
  });
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateSiteOrderStatus(orderId: string, status: string) {
  await prisma.siteOrder.update({
    where: { id: orderId },
    data:  { status: status as never },
  });
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateDeliveryMethod(orderId: string, deliveryMethod: string) {
  await prisma.siteOrder.update({
    where: { id: orderId },
    data:  { deliveryMethod },
  });

  if (deliveryMethod === "CARGO") {
    const existing = await prisma.finance.findFirst({
      where: { siteOrderId: orderId, category: "Kargo Gideri" },
    });
    if (!existing) {
      await prisma.finance.create({
        data: {
          type:        "EXPENSE",
          amount:      CARGO_FEE,
          description: `Kargo — Sipariş #${orderId.slice(-6)}`,
          category:    "Kargo Gideri",
          siteOrderId: orderId,
        },
      });
    }
  } else {
    await prisma.finance.deleteMany({
      where: { siteOrderId: orderId, category: "Kargo Gideri" },
    });
  }

  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/finans");
  return { success: true };
}

export async function updateSiteOrderDiscount(orderId: string, discount: number) {
  const order = await prisma.siteOrder.update({
    where: { id: orderId },
    data:  { discount },
  });

  // If already PAID, update the income finance record amount
  if (order.paymentStatus === "PAID") {
    const netAmount = Math.max(0, Number(order.total) - discount);
    const income = await prisma.finance.findFirst({
      where: { siteOrderId: orderId, type: "INCOME" },
    });
    if (income) {
      await prisma.finance.update({
        where: { id: income.id },
        data:  { amount: netAmount },
      });
    }
    revalidatePath("/admin/finans");
  }

  revalidatePath("/admin/siparisler");
  return { success: true };
}

async function ensureCostExpenses(orderId: string, order: { items: unknown; orderNo: string }) {
  const existingCost = await prisma.finance.findFirst({
    where: { siteOrderId: orderId, category: "Ürün Maliyeti" },
  });
  if (existingCost) return;

  const items = order.items as { productId: string; qty: number }[];
  const productIds = items.map((i) => i.productId).filter(Boolean);
  if (productIds.length === 0) return;

  const products = await prisma.product.findMany({
    where:  { id: { in: productIds } },
    select: { id: true, costPrice: true },
  });
  const totalCost = items.reduce((sum, item) => {
    const p = products.find((p) => p.id === item.productId);
    return sum + (p?.costPrice ? Number(p.costPrice) : 0) * item.qty;
  }, 0);
  if (totalCost > 0) {
    await prisma.finance.create({
      data: {
        type:        "EXPENSE",
        amount:      totalCost,
        description: `Ürün maliyeti — Sipariş #${order.orderNo}`,
        category:    "Ürün Maliyeti",
        siteOrderId: orderId,
      },
    });
  }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
  const order = await prisma.siteOrder.update({
    where: { id: orderId },
    data:  { paymentStatus },
  });

  if (paymentStatus === "PAID") {
    const existingIncome = await prisma.finance.findFirst({
      where: { siteOrderId: orderId, type: "INCOME" },
    });
    if (!existingIncome) {
      const netAmount = Math.max(0, Number(order.total) - Number(order.discount ?? 0));
      await prisma.finance.create({
        data: {
          type:        "INCOME",
          amount:      netAmount,
          description: `Sipariş #${order.orderNo}${Number(order.discount) > 0 ? ` (${Number(order.discount).toLocaleString("tr-TR")}₺ iskonto)` : ""}`,
          category:    "Satış",
          siteOrderId: orderId,
        },
      });
    }
    await ensureCostExpenses(orderId, order);
    revalidatePath("/admin/finans");
  }

  if (paymentStatus === "FREE") {
    await ensureCostExpenses(orderId, order);
    revalidatePath("/admin/finans");
  }

  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/borc-alacak");
  return { success: true };
}

// B2B (manuel) order payment: creates finance INCOME record
export async function updateManuelOrderPayment(orderId: string, paymentStatus: string) {
  await prisma.order.update({
    where: { id: orderId },
    data:  { paymentStatus },
  });

  if (paymentStatus === "PAID") {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const existing = await prisma.finance.findFirst({
      where: { description: { contains: `Sipariş #${order.orderNo}` }, type: "INCOME" },
    });
    if (!existing) {
      await prisma.finance.create({
        data: {
          type:        "INCOME",
          amount:      order.total,
          description: `Sipariş #${order.orderNo} (Manuel)`,
          category:    "Satış",
        },
      });
    }
    revalidatePath("/admin/finans");
  }

  revalidatePath("/admin/siparisler");
  return { success: true };
}

// Update B2B order total
export async function updateManuelOrderTotal(orderId: string, total: number) {
  await prisma.order.update({
    where: { id: orderId },
    data:  { total },
  });
  revalidatePath("/admin/siparisler");
  return { success: true };
}
