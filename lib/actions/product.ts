"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/actions/activity-log";

export type ProductFormData = {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  costPriceUsd?: number;
  categoryId?: string;
  brandId?: string;
  stock: number;
  isActive: boolean;
  isOzelKoleksiyon?: boolean;
  images: string[];
};

export async function getProducts() {
  return prisma.product.findMany({
    where: { deletedAt: null },
    include: { category: true, brand: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    include: { category: true, brand: true },
  });
}

export async function createProduct(data: ProductFormData) {
  await prisma.product.create({ data });
  revalidatePath("/admin/urunler");
  revalidatePath("/urunler");
  return { success: true };
}

export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  const prev = await prisma.product.findUnique({ where: { id }, select: { price: true, costPrice: true, name: true } });
  await prisma.product.update({ where: { id }, data });
  revalidatePath("/admin/urunler");
  revalidatePath("/urunler");

  if (data.price !== undefined && prev && Number(prev.price) !== data.price) {
    await logActivity({
      action:   "PRODUCT_PRICE_CHANGED",
      entity:   "PRODUCT",
      entityId: id,
      detail:   { name: prev.name, field: "price", from: Number(prev.price), to: data.price },
    });
  }
  if (data.costPrice !== undefined && prev && Number(prev.costPrice ?? 0) !== data.costPrice) {
    await logActivity({
      action:   "PRODUCT_PRICE_CHANGED",
      entity:   "PRODUCT",
      entityId: id,
      detail:   { name: prev.name, field: "costPrice", from: Number(prev.costPrice ?? 0), to: data.costPrice },
    });
    const { rebuildCostExpensesForProduct } = await import("./site-order-admin");
    await rebuildCostExpensesForProduct(id);
  }

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
