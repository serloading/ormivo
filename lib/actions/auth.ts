"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export async function register(formData: FormData) {
  const name     = (formData.get("name")     as string)?.trim();
  const email    = (formData.get("email")    as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string);

  if (!name || !email || !password)
    return { error: "Tüm alanları doldurun." };

  if (password.length < 6)
    return { error: "Şifre en az 6 karakter olmalı." };

  const exists = await prisma.siteUser.findUnique({ where: { email } });
  if (exists) return { error: "Bu e-posta zaten kayıtlı." };

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.siteUser.create({
    data: { name, email, passwordHash },
  });

  await createSession({ userId: user.id, email: user.email, name: user.name });
  return { success: true };
}

export async function login(formData: FormData) {
  const email    = (formData.get("email")    as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string);

  if (!email || !password)
    return { error: "E-posta ve şifre gerekli." };

  const user = await prisma.siteUser.findUnique({ where: { email } });
  if (!user) return { error: "E-posta veya şifre hatalı." };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok)  return { error: "E-posta veya şifre hatalı." };

  await createSession({ userId: user.id, email: user.email, name: user.name });
  return { success: true };
}

export async function logout() {
  await deleteSession();
}
