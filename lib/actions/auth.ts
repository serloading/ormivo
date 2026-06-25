"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export async function register(formData: FormData) {
  const phone    = (formData.get("phone")    as string)?.trim().replace(/\s/g, "");
  const password = (formData.get("password") as string);

  if (!phone || !password)
    return { error: "Telefon numarası ve şifre gerekli." };

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
