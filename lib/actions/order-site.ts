"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCart } from "@/lib/actions/cart";
import { useCoupon } from "@/lib/actions/coupon";
import { getSegmentPrice } from "@/lib/segment";
import { canonicalPhone } from "@/lib/phone";

const CARGO_FEE = 200;

interface GuestItem { productId: string; qty: number; }

interface PlaceOrderInput {
  recipientName:  string;
  recipientPhone: string;
  addressLine:    string;
  city:           string;
  district?:      string;
  note?:          string;
  guestItems?:    GuestItem[];
  saveAddress?:   boolean;
  couponCode?:    string;
  couponDiscount?: number;
  paymentMethod?: "HAVALE" | "KART";
  deliveryMethod?: "CARGO" | "STORE";
}

export async function placeOrder(input: PlaceOrderInput) {
  const { recipientName, recipientPhone, addressLine, city, district, note, guestItems, saveAddress, couponCode, couponDiscount, paymentMethod, deliveryMethod } = input;

  const isStore = deliveryMethod === "STORE";
  if (!isStore && !recipientName?.trim())  return { error: "Ad Soyad gerekli." };
  if (!isStore && !recipientPhone?.trim()) return { error: "Telefon gerekli." };
  if (!isStore && !addressLine?.trim())    return { error: "Adres gerekli." };
  if (!isStore && !city?.trim())           return { error: "Şehir gerekli." };

  const session = await getSession();

  let orderItems: { productId: string; name: string; price: number; qty: number }[] = [];
  let total = 0;

  const userSegment = session?.segment ?? null;

  if (session) {
    const cart = await getCart();
    const dbItems = cart?.items ?? [];
    if (dbItems.length === 0) return { error: "Sepetiniz boş." };

    type CartItem = { quantity: number; customPrice?: unknown; product: { id: string; name: string; price: unknown } };
    orderItems = (dbItems as CartItem[]).map((i) => {
      const originalPrice = Number(i.product.price);
      const segmentedPrice = getSegmentPrice(originalPrice, userSegment) ?? originalPrice;
      const effectivePrice = i.customPrice != null ? Number(i.customPrice) : segmentedPrice;
      return {
        productId:     i.product.id,
        name:          i.product.name,
        price:         effectivePrice,
        originalPrice: originalPrice,
        qty:           i.quantity,
      };
    });
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

  const phone = canonicalPhone(recipientPhone);

  let customer = await prisma.customer.findFirst({ where: { phone } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: recipientName.trim(), phone },
    });
  }

  // Segment indirimi: orijinal fiyat - segment fiyatı toplamı
  const segmentDiscountAmount = orderItems.reduce((s, i) => {
    const orig = (i as typeof i & { originalPrice?: number }).originalPrice ?? i.price;
    return s + (orig - i.price) * i.qty;
  }, 0);
  const totalDiscount = Math.round(segmentDiscountAmount) + (couponDiscount ?? 0);

  const order = await prisma.siteOrder.create({
    data: {
      recipientName:  recipientName.trim(),
      recipientPhone: phone,
      addressLine:    addressLine.trim(),
      city:           city.trim(),
      district:       district?.trim() || null,
      note:           note?.trim() || null,
      items:          orderItems,
      total:          Math.max(0, total - (couponDiscount ?? 0)),
      discount:       totalDiscount,
      couponCode:     couponCode ?? null,
      customerId:     customer.id,
      userId:         session?.userId ?? null,
      status:         "PENDING",
      paymentMethod:  paymentMethod ?? "HAVALE",
      deliveryMethod: deliveryMethod ?? "CARGO",
    },
  });

  // Decrement stock for all items
  for (const item of orderItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data:  { stock: { decrement: item.qty } },
    });
  }

  // Ürün maliyeti giderleri — sipariş oluşturulunca hemen kayıt
  const productIds = orderItems.map((i) => i.productId);
  const [productCosts, usdRateRow] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, costPriceUsd: true },
    }),
    prisma.setting.findUnique({ where: { key: "usd_rate" } }),
  ]);
  const usdRate = usdRateRow ? parseFloat(usdRateRow.value) : 38;
  for (const item of orderItems) {
    const prod = productCosts.find((p) => p.id === item.productId);
    if (!prod?.costPriceUsd) continue;
    const cost = Math.round(Number(prod.costPriceUsd) * usdRate) * item.qty;
    await prisma.finance.create({
      data: {
        type:        "EXPENSE",
        amount:      cost,
        description: `Ürün maliyeti — ${item.name} — #${order.orderNo}`,
        category:    "Ürün Maliyeti",
        siteOrderId: order.id,
      },
    });
  }

  // Kargo gideri — mağazadan teslimde kargo yok
  if ((deliveryMethod ?? "CARGO") === "CARGO") await prisma.finance.create({
    data: {
      type:        "EXPENSE",
      amount:      CARGO_FEE,
      description: `Kargo — Sipariş #${order.orderNo}`,
      category:    "Kargo Gideri",
      siteOrderId: order.id,
    },
  });

  if (couponCode) {
    await useCoupon(couponCode);
  }

  if (session) {
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: session.userId } },
    });

    if (saveAddress) {
      const exists = await prisma.address.findFirst({
        where: { userId: session.userId, addressLine: addressLine.trim(), city: city.trim() },
      });
      if (!exists) {
        const hasDefault = await prisma.address.count({ where: { userId: session.userId, isDefault: true } });
        await prisma.address.create({
          data: {
            userId:        session.userId,
            recipientName: recipientName.trim(),
            phone:         recipientPhone.trim().replace(/\s/g, ""),
            addressLine:   addressLine.trim(),
            city:          city.trim(),
            district:      district?.trim() || null,
            isDefault:     hasDefault === 0,
          },
        });
      }
    }
  }

  // Segment otomatik yükseltme (Diamond referral'ı hariç)
  if (session) {
    await autoUpdateSegment(session.userId);
  }

  revalidatePath("/hesabim");
  return { success: true, orderNo: order.orderNo };
}

export async function autoUpdateSegment(userId: string) {
  const user = await prisma.siteUser.findUnique({
    where: { id: userId },
    select: { segment: true, isB2BApproved: true, referredById: true, referredBy: { select: { segment: true } } },
  });
  if (!user) return;

  // Diamond, B2B veya Diamond üye tarafından davet edilmişse otomatik yükseltme yapma
  if (user.segment === "DIAMOND" || user.isB2BApproved) return;
  if (user.referredBy?.segment === "DIAMOND") return;

  // Toplam harcamayı hesapla (iptal edilmemiş siparişler)
  const agg = await prisma.siteOrder.aggregate({
    where: { userId, status: { not: "CANCELLED" } },
    _sum: { total: true },
  });
  const totalSpend = Number(agg._sum.total ?? 0);

  const newSegment =
    totalSpend >= 40000 ? "GOLD" :
    totalSpend >= 20000 ? "SILVER" :
    totalSpend > 0      ? "BRONZE" : null;

  if (newSegment !== user.segment) {
    await prisma.siteUser.update({
      where: { id: userId },
      data: { segment: newSegment },
    });
  }
}
