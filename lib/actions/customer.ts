"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type CustomerFormData = {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  note?: string;
};

export async function getCustomers() {
  return prisma.customer.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomer(data: CustomerFormData) {
  await prisma.customer.create({ data });
  revalidatePath("/admin/musteriler");
  return { success: true };
}

export async function updateCustomer(id: string, data: Partial<CustomerFormData>) {
  await prisma.customer.update({ where: { id }, data });
  revalidatePath("/admin/musteriler");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/admin/musteriler");
  return { success: true };
}
