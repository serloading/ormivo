"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function approveB2B(userId: string) {
  await prisma.siteUser.update({
    where: { id: userId },
    data: { isB2BApproved: true },
  });
  revalidatePath("/admin/bayiler");
}

export async function rejectB2B(userId: string) {
  await prisma.siteUser.update({
    where: { id: userId },
    data: { isB2B: false, isB2BApproved: false },
  });
  revalidatePath("/admin/bayiler");
}

export async function addB2BByPhone(phone: string, markup = 500): Promise<{ error?: string; success?: boolean }> {
  const { phoneLookupVariants } = await import("@/lib/phone");
  const user = await prisma.siteUser.findFirst({
    where: { phone: { in: phoneLookupVariants(phone) } },
  });
  if (!user) return { error: "Bu telefon numarasıyla kayıtlı kullanıcı bulunamadı." };
  const referralCode = user.referralCode ?? Math.random().toString(36).slice(2, 8).toUpperCase();
  await prisma.siteUser.update({
    where: { id: user.id },
    data: {
      isB2BApproved: true, isB2B: true, referralCode,
      ...(user.b2bMarkup == null ? { b2bMarkup: markup } : {}),
    },
  });
  revalidatePath("/admin/bayiler");
  return { success: true };
}

export async function revokeB2B(userId: string) {
  await prisma.siteUser.update({
    where: { id: userId },
    data: { isB2BApproved: false },
  });
  revalidatePath("/admin/bayiler");
}

export async function updateB2BMarkup(userId: string, markup: number) {
  await prisma.siteUser.update({
    where: { id: userId },
    data: { b2bMarkup: markup },
  });
  revalidatePath("/admin/bayiler");
}
