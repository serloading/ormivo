"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/actions/activity-log";

export type ProductFormData = {
  name: string;
  slug: string;
  description: string;
  scentNotes?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number | null;
  costPriceUsd?: number;
  categoryId?: string;
  extraCategoryIds?: string[];
  brandId?: string;
  stock: number;
  isActive: boolean;
  isOzelKoleksiyon?: boolean;
  isBestSeller?: boolean;
  images: string[];
};

export async function getProducts() {
  const rows = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true, productNo: true, name: true, slug: true,
      price: true, comparePrice: true, costPrice: true, costPriceUsd: true,
      stock: true, isActive: true, images: true, extraCategoryIds: true,
      category: { select: { id: true, name: true, slug: true } },
      brand:    { select: { id: true, name: true, slug: true } },
    },
    orderBy: { name: "asc" },
  });
  return rows.map((p) => ({
    ...p,
    price:        Number(p.price),
    comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null,
    costPrice:    p.costPrice    != null ? Number(p.costPrice)    : null,
    costPriceUsd: p.costPriceUsd != null ? Number(p.costPriceUsd) : null,
  }));
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
  if (data.costPriceUsd !== undefined) {
    await logActivity({
      action:   "PRODUCT_PRICE_CHANGED",
      entity:   "PRODUCT",
      entityId: id,
      detail:   { name: prev?.name, field: "costPriceUsd", to: data.costPriceUsd },
    });
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

export async function bulkUpdateProducts(ids: string[], data: Partial<ProductFormData>) {
  await prisma.product.updateMany({ where: { id: { in: ids } }, data });
  revalidatePath("/admin/urunler");
  revalidatePath("/urunler");
  return { success: true };
}

export async function updateProductImages(id: string, images: string[]) {
  await prisma.product.update({ where: { id }, data: { images } });
  revalidatePath("/admin/urunler");
  revalidatePath("/urunler");
  return { success: true };
}
