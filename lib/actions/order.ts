"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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
  shippingFee?: number | null;
  note?: string;
};

export async function getOrders() {
  return prisma.order.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrder(data: OrderFormData) {
  const orderNo = `ORV-${Date.now()}`;
  const order = await prisma.order.create({
    data: {
      orderNo,
      customerId: data.customerId,
      items: data.items as never,
      total: data.total,
      shippingFee: data.shippingFee ?? null,
      note: data.note,
    },
  });
  revalidatePath("/admin/siparisler");
  return { success: true, id: order.id, orderNo: order.orderNo };
}

export async function updateOrderStatus(
  id: string,
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED"
) {
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function deleteOrder(id: string) {
  await prisma.order.delete({ where: { id } });
  revalidatePath("/admin/siparisler");
  return { success: true };
}
