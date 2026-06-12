"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ProductFormData = {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  categoryId?: string;
  stock: number;
  isActive: boolean;
  images: string[];
};

export async function getProducts() {
  return prisma.product.findMany({
    where: { deletedAt: null },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    include: { category: true },
  });
}

export async function createProduct(data: ProductFormData) {
  await prisma.product.create({ data });
  revalidatePath("/admin/urunler");
  revalidatePath("/urunler");
  return { success: true };
}

export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  await prisma.product.update({ where: { id }, data });
  revalidatePath("/admin/urunler");
  revalidatePath("/urunler");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  revalidatePath("/admin/urunler");
  revalidatePath("/urunler");
  return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean) {
  await prisma.product.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/urunler");
  return { success: true };
}

export async function updateProductStock(id: string, stock: number) {
  await prisma.product.update({ where: { id }, data: { stock } });
  revalidatePath("/admin/stok");
  revalidatePath("/admin/urunler");
  return { success: true };
}
