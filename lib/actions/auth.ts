"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { syncSiteUserFromCustomerPhone } from "@/lib/site-user-sync";
import { canonicalPhone, normalizePhoneDigits, phoneLookupVariants } from "@/lib/phone";

export async function register(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phoneRaw = (formData.get("phone") as string)?.trim();
  const password = (formData.get("password") as string);

  if (!name || name.length < 2) {
    return { error: "Ad Soyad en az 2 karakter olmalı." };
  }

  if (!phoneRaw || !password) {
    return { error: "Telefon numarası ve şifre gerekli." };
  }

  const digits = normalizePhoneDigits(phoneRaw);
  if (phoneRaw.includes("@") || digits.length < 10 || digits.length > 12) {
    return { error: "Geçerli bir telefon numarası girin (örn: 05XX XXX XX XX)." };
  }

  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalı." };
  }

  const phone = canonicalPhone(phoneRaw);
  const exists = await prisma.siteUser.findFirst({
    where: { phone: { in: phoneLookupVariants(phoneRaw) } },
  });
  if (exists) return { error: "Bu telefon numarası zaten kayıtlı." };

  // Referral: ref kodu ile gelen kayıtlarda referrer'ı bul
  const refCode = (formData.get("refCode") as string)?.trim() || null;
  let referredById: string | null = null;
  if (refCode) {
    const referrer = await prisma.siteUser.findUnique({
      where: { referralCode: refCode },
      select: { id: true },
    });
    if (referrer) referredById = referrer.id;
  }

  // Her kullanıcıya benzersiz referral kodu üret
  const referralCode = Math.random().toString(36).slice(2, 8).toUpperCase();

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.siteUser.create({
    data: { phone, name, passwordHash, referralCode, referredById },
  });

  const existingCustomer = await prisma.customer.findFirst({ where: { phone } });
  if (!existingCustomer) {
    const allNos = await prisma.customer.findMany({ where: { customerNo: { not: null } }, select: { customerNo: true } });
    const maxNum = allNos.reduce((m, c) => {
      const n = c.customerNo ? parseInt(c.customerNo.replace("MUS-", ""), 10) : 0;
      return Math.max(m, isNaN(n) ? 0 : n);
    }, 0);
    const customerNo = `MUS-${String(maxNum + 1).padStart(4, "0")}`;
    await prisma.customer.create({ data: { name, phone, tags: [], customerNo } });
  }

  await createSession({
    userId: user.id,
    phone: user.phone,
    name: user.name,
    segment: existingCustomer?.segment ?? user.segment ?? null,
  });
  return { success: true };
}

export async function login(formData: FormData) {
  const phoneRaw = (formData.get("phone") as string)?.trim();
  const password = (formData.get("password") as string);

  if (!phoneRaw || !password) {
    return { error: "Telefon numarası ve şifre gerekli." };
  }

  const user = await prisma.siteUser.findFirst({
    where: { phone: { in: phoneLookupVariants(phoneRaw) } },
  });
  if (!user) return { error: "Telefon numarası veya şifre hatalı." };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "Telefon numarası veya şifre hatalı." };

  await createSession({ userId: user.id, phone: user.phone, name: user.name, segment: user.segment ?? null });
  return { success: true, mustChangePassword: user.mustChangePassword };
}

export async function changePassword(formData: FormData) {
  const { getSession } = await import("@/lib/session");
  const session = await getSession();
  if (!session) return { error: "Oturum açık değil." };

  const newPassword = (formData.get("password") as string);
  const confirm = (formData.get("confirm") as string);

  if (!newPassword || newPassword.length < 8) {
    return { error: "Şifre en az 8 karakter olmalı." };
  }
  if (newPassword !== confirm) {
    return { error: "Şifreler eşleşmiyor." };
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.siteUser.update({
    where: { id: session.userId },
    data: { passwordHash: hash, mustChangePassword: false },
  });
  return { success: true };
}

export async function logout() {
  await deleteSession();
}

export async function updateSiteUserProfile(data: { name?: string; phone?: string; email?: string; currentPassword?: string; newPassword?: string }) {
  const { getSession } = await import("@/lib/session");
  const session = await getSession();
  if (!session) return { error: "Oturum açık değil." };

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name || name.length < 2) return { error: "Ad en az 2 karakter olmalı." };
    if (name.length > 60) return { error: "Ad en fazla 60 karakter olabilir." };
    updateData.name = name;
  }

  if (data.email !== undefined) {
    const email = data.email.trim();
    updateData.email = email || null;
  }

  if (data.phone !== undefined) {
    const phone = canonicalPhone(data.phone);
    if (!phone || phone.length < 10) return { error: "Geçerli bir telefon numarası girin." };
    const existing = await prisma.siteUser.findFirst({ where: { phone, id: { not: session.userId } } });
    if (existing) return { error: "Bu telefon numarası zaten kullanımda." };
    updateData.phone = phone;
  }

  if (data.newPassword) {
    if (!data.currentPassword) return { error: "Mevcut şifrenizi girin." };
    const user = await prisma.siteUser.findUnique({ where: { id: session.userId } });
    if (!user?.passwordHash) return { error: "Şifre değiştirilemedi." };
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) return { error: "Mevcut şifre yanlış." };
    if (data.newPassword.length < 8) return { error: "Yeni şifre en az 8 karakter olmalı." };
    updateData.passwordHash = await bcrypt.hash(data.newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) return { error: "Değişiklik yok." };

  const updatedUser = await prisma.siteUser.update({ where: { id: session.userId }, data: updateData });

  const customerPhone = (updateData.phone as string | undefined) ?? session.phone;
  const existingCust = await prisma.customer.findFirst({ where: { phone: customerPhone } });
  if (existingCust) {
    if (updateData.name) await prisma.customer.update({ where: { id: existingCust.id }, data: { name: updateData.name as string } });
  } else {
    await prisma.customer.create({ data: { phone: customerPhone, name: (updatedUser.name ?? customerPhone) } });
  }

  await syncSiteUserFromCustomerPhone(customerPhone);

  return { success: true };
}

export async function updateSiteUserName(formData: FormData) {
  const { getSession } = await import("@/lib/session");
  const session = await getSession();
  if (!session) return { error: "Oturum açık değil." };

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 2) return { error: "Ad en az 2 karakter olmalı." };
  if (name.length > 60) return { error: "Ad en fazla 60 karakter olabilir." };

  await prisma.siteUser.update({
    where: { id: session.userId },
    data: { name },
  });
  return { success: true };
}
