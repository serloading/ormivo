"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function getUserCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where:   { userId },
    include: { items: { include: { product: { include: { brand: true, category: true } } } } },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data:    { userId },
      include: { items: { include: { product: { include: { brand: true, category: true } } } } },
    });
  }
  return cart;
}

export async function getCart() {
  const session = await getSession();
  if (!session) return null;
  return getUserCart(session.userId);
}

export async function getCartCount(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;
  const cart = await prisma.cart.findUnique({
    where:   { userId: session.userId },
    include: { items: true },
  });
  return cart?.items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0) ?? 0;
}

export async function addToCart(productId: string) {
  const session = await getSession();
  if (!session) return { error: "Giriş yapmanız gerekiyor." };

  const cart = await getUserCart(session.userId);

  const existing = (cart.items as Array<{ id: string; productId: string; quantity: number }>).find((i) => i.productId === productId);
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data:  { quantity: existing.quantity + 1 },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity: 1 },
    });
  }

  revalidatePath("/");
  revalidatePath("/sepet");
  return { success: true };
}

export async function updateCartItem(itemId: string, quantity: number) {
  const session = await getSession();
  if (!session) return { error: "Giriş yapmanız gerekiyor." };

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  revalidatePath("/sepet");
  return { success: true };
}

export async function removeFromCart(itemId: string) {
  const session = await getSession();
  if (!session) return { error: "Giriş yapmanız gerekiyor." };

  await prisma.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/sepet");
  return { success: true };
}

export async function clearCart() {
  const session = await getSession();
  if (!session) return;
  const cart = await prisma.cart.findUnique({ where: { userId: session.userId } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  revalidatePath("/sepet");
}
