"use server";

import { revalidatePath } from "next/cache";
import { prisma }     from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function toggleFavorite(productId: string) {
  const session = await getSession();
  if (!session) return { error: "Giriş yapılmamış." };

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/hesabim");
    revalidatePath("/urunler");
    return { favorited: false };
  } else {
    await prisma.favorite.create({ data: { userId: session.userId, productId } });
    revalidatePath("/hesabim");
    revalidatePath("/urunler");
    return { favorited: true };
  }
}

export async function getUserFavoriteIds(): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];

  const favs = await prisma.favorite.findMany({
    where:  { userId: session.userId },
    select: { productId: true },
  });
  return favs.map((f) => f.productId);
}
