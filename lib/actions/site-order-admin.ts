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
    // Kargo gideri yoksa oluştur
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
    // PICKUP seçildiyse kargo giderini sil
    await prisma.finance.deleteMany({
      where: { siteOrderId: orderId, category: "Kargo Gideri" },
    });
  }

  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/finans");
  return { success: true };
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
  const order = await prisma.siteOrder.update({
    where: { id: orderId },
    data:  { paymentStatus },
  });

  if (paymentStatus === "PAID") {
    // Satış geliri (aynı sipariş için yoksa oluştur)
    const existingIncome = await prisma.finance.findFirst({
      where: { siteOrderId: orderId, type: "INCOME" },
    });
    if (!existingIncome) {
      await prisma.finance.create({
        data: {
          type:        "INCOME",
          amount:      order.total,
          description: `Sipariş #${order.orderNo}`,
          category:    "Satış",
          siteOrderId: orderId,
        },
      });
    }

    // Ürün alış fiyatı gideri
    const existingCost = await prisma.finance.findFirst({
      where: { siteOrderId: orderId, category: "Ürün Maliyeti" },
    });
    if (!existingCost) {
      const items = order.items as { productId: string; qty: number }[];
      const productIds = items.map((i) => i.productId).filter(Boolean);
      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where:  { id: { in: productIds } },
          select: { id: true, costPrice: true },
        });
        const totalCost = items.reduce((sum, item) => {
          const p = products.find((p) => p.id === item.productId);
          const cost = p?.costPrice ? Number(p.costPrice) : 0;
          return sum + cost * item.qty;
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
    }

    revalidatePath("/admin/finans");
  }

  revalidatePath("/admin/siparisler");
  return { success: true };
}
