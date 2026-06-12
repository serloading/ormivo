"use server";

// import { prisma } from "@/lib/prisma";
// import { revalidatePath } from "next/cache";

export type OrderItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
};

export type OrderFormData = {
  customerId: string;
  items: OrderItem[];
  total: number;
  note?: string;
};

export async function createOrder(data: OrderFormData) {
  // const orderNo = `ORV-${Date.now()}`;
  // await prisma.order.create({
  //   data: { orderNo, ...data, items: data.items as any },
  // });
  // revalidatePath("/admin/siparisler");

  console.log("createOrder (mock):", data);
  return { success: true };
}

export async function updateOrderStatus(
  id: string,
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED"
) {
  // await prisma.order.update({ where: { id }, data: { status } });
  // revalidatePath("/admin/siparisler");

  console.log("updateOrderStatus (mock):", id, status);
  return { success: true };
}
