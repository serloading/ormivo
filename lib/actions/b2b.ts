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

export async function addB2BByPhone(
  phone: string,
  markup = 500,
  extra?: { name?: string; email?: string; note?: string; segment?: string }
): Promise<{ error?: string; success?: boolean }> {
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
      ...(extra?.name ? { name: extra.name } : {}),
      ...(extra?.email ? { email: extra.email } : {}),
      ...(extra?.note ? { b2bNote: extra.note } : {}),
      ...(extra?.segment ? { segment: extra.segment } : {}),
    },
  });
  revalidatePath("/admin/bayiler");
  return { success: true };
}

export async function revokeB2B(userId: string) {
  await prisma.siteUser.update({
    where: { id: userId },
    data: { isB2BApproved: false, isB2B: false, segment: null },
  });
  revalidatePath("/admin/bayiler");
}

export async function updateB2BMarkup(userId: string, markup: number) {
  await prisma.siteUser.update({
    where: { id: userId },
    data: { b2bMarkup: markup },
  });
  revalidatePath("/admin/bayiler");
  revalidatePath(`/admin/bayiler/${userId}`);
}

export async function updateBayiProfile(
  userId: string,
  data: {
    name?: string;
    email?: string | null;
    b2bMarkup?: number | null;
    b2bNote?: string | null;
    segment?: string | null;
    referralCode?: string | null;
  }
): Promise<{ error?: string; success?: boolean }> {
  try {
    // referralCode uniqueness check
    if (data.referralCode) {
      const existing = await prisma.siteUser.findUnique({
        where: { referralCode: data.referralCode },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        return { error: "Bu referral kodu zaten kullanımda." };
      }
    }
    // Segment DIAMOND'dan başka bir şeye çekiliyorsa B2B bayraklarını da kaldır
    const isDemotingFromB2B =
      data.segment !== undefined && data.segment !== "DIAMOND";
    await prisma.siteUser.update({
      where: { id: userId },
      data: {
        ...(data.name != null ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.b2bMarkup !== undefined ? { b2bMarkup: data.b2bMarkup } : {}),
        ...(data.b2bNote !== undefined ? { b2bNote: data.b2bNote } : {}),
        ...(data.segment !== undefined ? { segment: data.segment } : {}),
        ...(data.referralCode !== undefined ? { referralCode: data.referralCode || null } : {}),
        ...(isDemotingFromB2B ? { isB2BApproved: false, isB2B: false } : {}),
      },
    });
    revalidatePath("/admin/bayiler");
    revalidatePath(`/admin/bayiler/${userId}`);
    return { success: true };
  } catch {
    return { error: "Kayıt güncellenemedi." };
  }
}
