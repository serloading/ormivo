"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type CategoryFormData = {
  name: string;
  slug: string;
  description?: string;
};

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory(data: CategoryFormData) {
  await prisma.category.create({ data });
  revalidatePath("/admin/kategoriler");
  revalidatePath("/urunler");
  return { success: true };
}

export async function updateCategory(id: string, data: Partial<CategoryFormData>) {
  await prisma.category.update({ where: { id }, data });
  revalidatePath("/admin/kategoriler");
  revalidatePath("/urunler");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/kategoriler");
  revalidatePath("/urunler");
  return { success: true };
}
