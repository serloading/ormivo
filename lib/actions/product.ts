"use server";

import { revalidatePath } from "next/cache";
// import { prisma } from "@/lib/prisma"; // Supabase bağlanınca açılacak

export type ProductFormData = {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  categoryId?: string;
  stock: number;
  isActive: boolean;
  images: string[];
};

export async function createProduct(data: ProductFormData) {
  // Supabase bağlanınca aktif olacak:
  // await prisma.product.create({ data });
  // revalidatePath("/admin/urunler");
  // revalidatePath("/urunler");

  console.log("createProduct (mock):", data);
  return { success: true };
}

export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  // await prisma.product.update({ where: { id }, data });
  // revalidatePath("/admin/urunler");

  console.log("updateProduct (mock):", id, data);
  return { success: true };
}

export async function deleteProduct(id: string) {
  // Soft delete
  // await prisma.product.update({
  //   where: { id },
  //   data: { deletedAt: new Date(), isActive: false },
  // });
  // revalidatePath("/admin/urunler");

  console.log("deleteProduct (mock):", id);
  return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean) {
  // await prisma.product.update({ where: { id }, data: { isActive } });
  // revalidatePath("/admin/urunler");

  console.log("toggleProductActive (mock):", id, isActive);
  return { success: true };
}
