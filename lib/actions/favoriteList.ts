"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function createFavoriteList(name: string, productIds: string[]) {
  const session = await getSession();
  if (!session) return { error: "Oturum açınız" };
  if (!name.trim()) return { error: "Liste adı boş olamaz" };

  await prisma.favoriteList.create({
    data: { userId: session.userId, name: name.trim(), productIds },
  });
  revalidatePath("/hesabim");
  revalidatePath("/hesabim/favorilerim");
  return { success: true };
}

export async function deleteFavoriteList(id: string) {
  const session = await getSession();
  if (!session) return { error: "Oturum açınız" };

  await prisma.favoriteList.deleteMany({ where: { id, userId: session.userId } });
  revalidatePath("/hesabim");
  revalidatePath("/hesabim/favorilerim");
  return { success: true };
}

export async function updateFavoriteList(id: string, name: string, productIds: string[]) {
  const session = await getSession();
  if (!session) return { error: "Oturum açınız" };

  await prisma.favoriteList.updateMany({
    where: { id, userId: session.userId },
    data: { name: name.trim(), productIds },
  });
  revalidatePath("/hesabim");
  revalidatePath("/hesabim/favorilerim");
  return { success: true };
}
