"use server";

import { prisma } from "@/lib/prisma";

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
  return { success: true };
}

export async function updateOrderStatus(orderId: string, status: string) {
  await prisma.siteOrder.update({
    where: { id: orderId },
    data:  { status: status as never },
  });
  return { success: true };
}
