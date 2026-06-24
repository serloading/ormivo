"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function validateCoupon(code: string, orderTotal: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
  if (!coupon) return { valid: false, error: "Kupon bulunamadı." };
  if (!coupon.isActive) return { valid: false, error: "Bu kupon artık geçerli değil." };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, error: "Bu kuponun süresi dolmuş." };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, error: "Bu kupon kullanım limitine ulaşmış." };
  if (coupon.minOrderTotal && orderTotal < Number(coupon.minOrderTotal)) {
    return { valid: false, error: `Bu kupon minimum ${Number(coupon.minOrderTotal).toLocaleString("tr-TR")} ₺ sipariş için geçerlidir.` };
  }
  const discount = coupon.discountType === "PERCENT"
    ? Math.round(orderTotal * Number(coupon.discountValue) / 100)
    : Math.min(orderTotal, Number(coupon.discountValue));
  return { valid: true, discount, coupon: { id: coupon.id, code: coupon.code, discountType: coupon.discountType, discountValue: Number(coupon.discountValue) } };
}

export async function useCoupon(code: string) {
  await prisma.coupon.update({
    where: { code: code.toUpperCase().trim() },
    data: { usedCount: { increment: 1 } },
  });
}

export async function getCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createCoupon(data: {
  code: string; discountType: string; discountValue: number;
  minOrderTotal?: number; maxUses?: number; expiresAt?: string; isActive: boolean;
}) {
  await prisma.coupon.create({
    data: {
      code: data.code.toUpperCase().trim(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderTotal: data.minOrderTotal ?? null,
      maxUses: data.maxUses ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive,
    },
  });
  revalidatePath("/admin/kuponlar");
}

export async function updateCoupon(id: string, data: { isActive?: boolean; maxUses?: number | null }) {
  await prisma.coupon.update({ where: { id }, data });
  revalidatePath("/admin/kuponlar");
}

export async function deleteCoupon(id: string) {
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/kuponlar");
}
