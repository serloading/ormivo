"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export async function register(formData: FormData) {
  const phone    = (formData.get("phone")    as string)?.trim().replace(/\s/g, "");
  const password = (formData.get("password") as string);

  if (!phone || !password)
    return { error: "Telefon numarası ve şifre gerekli." };

  // Telefon numarası doğrulama: sadece rakam, 10-11 hane, @ içermemeli
  const digits = phone.replace(/\D/g, "");
  if (phone.includes("@") || digits.length < 10 || digits.length > 11)
    return { error: "Geçerli bir telefon numarası girin (örn: 05XX XXX XX XX)." };

  if (password.length < 6)
    return { error: "Şifre en az 6 karakter olmalı." };

  const exists = await prisma.siteUser.findUnique({ where: { phone } });
  if (exists) return { error: "Bu telefon numarası zaten kayıtlı." };

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.siteUser.create({
    data: { phone, passwordHash },
  });

  await createSession({ userId: user.id, phone: user.phone, name: user.name });
  return { success: true };
}

export async function login(formData: FormData) {
  const phone    = (formData.get("phone")    as string)?.trim().replace(/\s/g, "");
  const password = (formData.get("password") as string);

  if (!phone || !password)
    return { error: "Telefon numarası ve şifre gerekli." };

  const user = await prisma.siteUser.findUnique({ where: { phone } });
  if (!user) return { error: "Telefon numarası veya şifre hatalı." };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok)  return { error: "Telefon numarası veya şifre hatalı." };

  await createSession({ userId: user.id, phone: user.phone, name: user.name });
  return { success: true, mustChangePassword: user.mustChangePassword };
}

export async function changePassword(formData: FormData) {
  const { getSession } = await import("@/lib/session");
  const session = await getSession();
  if (!session) return { error: "Oturum açık değil." };

  const newPassword = (formData.get("password") as string);
  const confirm     = (formData.get("confirm")   as string);

  if (!newPassword || newPassword.length < 8)
    return { error: "Şifre en az 8 karakter olmalı." };
  if (newPassword !== confirm)
    return { error: "Şifreler eşleşmiyor." };

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

export async function updateSiteUserProfile(data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) {
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

  if (data.phone !== undefined) {
    const phone = data.phone.trim().replace(/\s/g, "");
    if (!phone || phone.length < 10) return { error: "Geçerli bir telefon numarası girin." };
    // Aynı telefon başka kullanıcıda kayıtlı mı?
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

  await prisma.siteUser.update({ where: { id: session.userId }, data: updateData });
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
