"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type BrandFormData = {
  name: string;
  slug: string;
  logo?: string;
};

export async function getBrands() {
  return prisma.brand.findMany({ orderBy: { name: "asc" } });
}

export async function createBrand(data: BrandFormData) {
  await prisma.brand.create({ data });
  revalidatePath("/admin/markalar");
  revalidatePath("/urunler");
  return { success: true };
}

export async function updateBrand(id: string, data: Partial<BrandFormData>) {
  await prisma.brand.update({ where: { id }, data });
  revalidatePath("/admin/markalar");
  revalidatePath("/urunler");
  return { success: true };
}

export async function deleteBrand(id: string) {
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/markalar");
  revalidatePath("/urunler");
  return { success: true };
}
