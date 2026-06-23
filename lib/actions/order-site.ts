"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCart } from "@/lib/actions/cart";

interface GuestItem { productId: string; qty: number; }

interface PlaceOrderInput {
  recipientName:  string;
  recipientPhone: string;
  addressLine:    string;
  city:           string;
  district?:      string;
  note?:          string;
  guestItems?:    GuestItem[];
}

export async function placeOrder(input: PlaceOrderInput) {
  const { recipientName, recipientPhone, addressLine, city, district, note, guestItems } = input;

  if (!recipientName?.trim())  return { error: "Ad Soyad gerekli." };
  if (!recipientPhone?.trim()) return { error: "Telefon gerekli." };
  if (!addressLine?.trim())    return { error: "Adres gerekli." };
  if (!city?.trim())           return { error: "Şehir gerekli." };

  const session = await getSession();

  let orderItems: { productId: string; name: string; price: number; qty: number }[] = [];
  let total = 0;

  if (session) {
    const cart = await getCart();
    const dbItems = cart?.items ?? [];
    if (dbItems.length === 0) return { error: "Sepetiniz boş." };

    type CartItem = { quantity: number; product: { id: string; name: string; price: unknown } };
    orderItems = (dbItems as CartItem[]).map((i) => ({
      productId: i.product.id,
      name:      i.product.name,
      price:     Number(i.product.price),
      qty:       i.quantity,
    }));
    total = orderItems.reduce((s: number, i) => s + i.price * i.qty, 0);
  } else {
    if (!guestItems || guestItems.length === 0) return { error: "Sepetiniz boş." };

    const products = await prisma.product.findMany({
      where: { id: { in: guestItems.map((i) => i.productId) } },
      select: { id: true, name: true, price: true },
    });

    type ProductRow = { id: string; name: string; price: unknown };
    orderItems = guestItems.map((gi) => {
      const p   = (products as ProductRow[]).find((p) => p.id === gi.productId);
      const qty = Math.max(1, Math.min(999, Math.floor(Number(gi.qty) || 1)));
      if (!p) return null;
      return { productId: p.id, name: p.name, price: Number(p.price), qty };
    }).filter(Boolean) as typeof orderItems;

    if (orderItems.length === 0) return { error: "Ürünler bulunamadı." };
    total = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  }

  const phone = recipientPhone.trim().replace(/\s/g, "");

  let customer = await prisma.customer.findFirst({ where: { phone } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: recipientName.trim(), phone },
    });
  }

  const order = await prisma.siteOrder.create({
    data: {
      recipientName:  recipientName.trim(),
      recipientPhone: phone,
      addressLine:    addressLine.trim(),
      city:           city.trim(),
      district:       district?.trim() || null,
      note:           note?.trim() || null,
      items:          orderItems,
      total,
      customerId:     customer.id,
      userId:         session?.userId ?? null,
      status:         "PENDING",
    },
  });

  if (session) {
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: session.userId } },
    });
  }

  return { success: true, orderNo: order.orderNo };
}
