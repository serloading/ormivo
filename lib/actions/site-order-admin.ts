"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
  const order = await prisma.siteOrder.update({
    where: { id: orderId },
    data:  { paymentStatus },
  });

  if (paymentStatus === "PAID") {
    const existing = await prisma.finance.findFirst({ where: { siteOrderId: orderId } });
    if (!existing) {
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
    revalidatePath("/admin/finans");
  }

  revalidatePath("/admin/siparisler");
  return { success: true };
}
