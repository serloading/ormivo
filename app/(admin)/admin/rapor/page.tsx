import { prisma } from "@/lib/prisma";
import RaporClient from "./RaporClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rapor — Admin" };

const CARGO_FEE = 200;

export default async function RaporPage() {
  const [siteOrders, b2bOrders, finance, categories, brands, products] = await Promise.all([
    prisma.siteOrder.findMany({
      select: { items: true, total: true, discount: true, paymentStatus: true, deliveryMethod: true, createdAt: true, status: true, recipientName: true },
    }),
    prisma.order.findMany({
      select: { items: true, total: true, paymentStatus: true, deliveryMethod: true, createdAt: true, customer: { select: { id: true, name: true } } },
    }),
    prisma.finance.findMany({
      select: { type: true, amount: true, category: true, date: true },
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      select: { id: true, name: true, categoryId: true, brandId: true, category: { select: { name: true } }, brand: { select: { name: true } } },
    }),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));

  type SoldItem = {
    productId: string | null; name: string; qty: number; revenue: number;
    categoryId: string | null; categoryName: string | null;
    brandId: string | null; brandName: string | null;
    orderDate: Date; source: "web" | "manuel";
  };
  const soldItems: SoldItem[] = [];

  // Finans: gelir ve kargo doğrudan siparişlerden hesapla (Finance tablosuna bağımlı olmadan)
  type FinanceSummary = { gelir: number; kargoGider: number; orderDate: Date };
  const financeSummary: FinanceSummary[] = [];

  const customerMap = new Map<string, { name: string; orderCount: number; totalSpend: number }>();

  for (const order of siteOrders) {
    const items = order.items as { productId?: string; name: string; qty: number; price: number }[];
    const orderTotal = Number(order.total);
    const itemsSum = items.reduce((s, i) => s + i.price * i.qty, 0);
    // Gerçek satış fiyatını orantısal dağıt (manuel düzeltme yapıldıysa order.total baz alınır)
    const scale = itemsSum > 0 ? orderTotal / itemsSum : 1;

    for (const item of items) {
      const prod = item.productId ? productMap.get(item.productId) : null;
      soldItems.push({
        productId:    item.productId ?? null,
        name:         item.name,
        qty:          item.qty,
        revenue:      Math.round(item.price * item.qty * scale),
        categoryId:   prod?.categoryId ?? null,
        categoryName: prod?.category?.name ?? null,
        brandId:      prod?.brandId ?? null,
        brandName:    prod?.brand?.name ?? null,
        orderDate:    order.createdAt,
        source:       "web",
      });
    }

    // Finans özeti
    if (order.paymentStatus === "PAID") {
      const discount = Number(order.discount ?? 0);
      financeSummary.push({
        gelir: Math.max(0, orderTotal - discount),
        kargoGider: order.deliveryMethod === "CARGO" ? CARGO_FEE : 0,
        orderDate: order.createdAt,
      });
    } else if (order.paymentStatus === "FREE") {
      financeSummary.push({
        gelir: 0,
        kargoGider: order.deliveryMethod === "CARGO" ? CARGO_FEE : 0,
        orderDate: order.createdAt,
      });
    }

    const netTotal = Math.max(0, orderTotal - Number(order.discount ?? 0));
    const key = `web-${order.recipientName}`;
    const existing = customerMap.get(key);
    if (existing) { existing.orderCount += 1; existing.totalSpend += netTotal; }
    else customerMap.set(key, { name: order.recipientName ?? "Bilinmiyor", orderCount: 1, totalSpend: netTotal });
  }

  for (const order of b2bOrders) {
    const items = order.items as { productId?: string; productName?: string; name?: string; quantity?: number; qty?: number; price: number }[];
    const orderTotal = Number(order.total);
    const itemsSum = items.reduce((s, i) => s + i.price * (i.quantity ?? i.qty ?? 1), 0);
    const scale = itemsSum > 0 ? orderTotal / itemsSum : 1;

    for (const item of items) {
      const name = item.productName ?? item.name ?? "—";
      const qty  = item.quantity ?? item.qty ?? 1;
      const prod2 = item.productId ? productMap.get(item.productId) : null;
      soldItems.push({
        productId:    item.productId ?? null,
        name,
        qty,
        revenue:      Math.round(item.price * qty * scale),
        categoryId:   prod2?.categoryId ?? null,
        categoryName: prod2?.category?.name ?? null,
        brandId:      prod2?.brandId ?? null,
        brandName:    prod2?.brand?.name ?? null,
        orderDate:    order.createdAt,
        source:       "manuel",
      });
    }

    if (order.paymentStatus === "PAID") {
      financeSummary.push({
        gelir: orderTotal,
        kargoGider: order.deliveryMethod === "CARGO" ? CARGO_FEE : 0,
        orderDate: order.createdAt,
      });
    } else if (order.paymentStatus === "FREE") {
      financeSummary.push({
        gelir: 0,
        kargoGider: order.deliveryMethod === "CARGO" ? CARGO_FEE : 0,
        orderDate: order.createdAt,
      });
    }

    if (order.customer) {
      const key = order.customer.id;
      const existing = customerMap.get(key);
      if (existing) { existing.orderCount += 1; existing.totalSpend += orderTotal; }
      else customerMap.set(key, { name: order.customer.name, orderCount: 1, totalSpend: orderTotal });
    }
  }

  // Ürün maliyeti hâlâ Finance tablosundan (costPrice takibi orada)
  const urunMaliyeti = finance
    .filter((f) => f.category === "Ürün Maliyeti")
    .map((f) => ({ amount: Number(f.amount), date: f.date.toISOString() }));

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.orderCount - a.orderCount || b.totalSpend - a.totalSpend)
    .slice(0, 20);

  return (
    <RaporClient
      soldItems={soldItems.map((i) => ({ ...i, orderDate: i.orderDate.toISOString() }))}
      financeSummary={financeSummary.map((f) => ({ ...f, orderDate: f.orderDate.toISOString() }))}
      urunMaliyeti={urunMaliyeti}
      categories={categories}
      brands={brands}
      topCustomers={topCustomers}
    />
  );
}
