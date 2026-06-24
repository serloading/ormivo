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

async function generateProductNo(): Promise<string> {
  const last = await prisma.product.findFirst({
    where: { productNo: { not: null } },
    orderBy: { productNo: "desc" },
    select: { productNo: true },
  });
  const lastNum = last?.productNo ? parseInt(last.productNo.replace("PRD-", ""), 10) : 0;
  return `PRD-${String(lastNum + 1).padStart(4, "0")}`;
}

export async function createProduct(data: ProductFormData) {
  const productNo = await generateProductNo();
  await prisma.product.create({ data: { ...data, productNo } });
  revalidatePath("/admin/urunler");
  revalidatePath("/urunler");
  return { success: true };
}

export async function backfillProductNos() {
  const products = await prisma.product.findMany({
    where: { productNo: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const last = await prisma.product.findFirst({
    where: { productNo: { not: null } },
    orderBy: { productNo: "desc" },
    select: { productNo: true },
  });
  let num = last?.productNo ? parseInt(last.productNo.replace("PRD-", ""), 10) : 0;
  for (const p of products) {
    num++;
    await prisma.product.update({
      where: { id: p.id },
      data: { productNo: `PRD-${String(num).padStart(4, "0")}` },
    });
  }
  return { count: products.length };
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
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true, costPrice: true } });

  if (product) {
    // O ürünün adını içeren tüm "Ürün Maliyeti" finance kayıtlarını sil
    await prisma.finance.deleteMany({
      where: { category: "Ürün Maliyeti", description: { contains: product.name } },
    });
  }

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/finans");
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
