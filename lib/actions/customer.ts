"use server";

// import { prisma } from "@/lib/prisma";
// import { revalidatePath } from "next/cache";

export type CustomerFormData = {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  note?: string;
};

export async function createCustomer(data: CustomerFormData) {
  // await prisma.customer.create({ data });
  // revalidatePath("/admin/musteriler");

  console.log("createCustomer (mock):", data);
  return { success: true };
}

export async function updateCustomer(id: string, data: Partial<CustomerFormData>) {
  // await prisma.customer.update({ where: { id }, data });
  // revalidatePath("/admin/musteriler");

  console.log("updateCustomer (mock):", id, data);
  return { success: true };
}
