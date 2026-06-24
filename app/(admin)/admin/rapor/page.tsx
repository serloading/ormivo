import { prisma } from "@/lib/prisma";
import RaporClient from "./RaporClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rapor — Admin" };

export default async function RaporPage() {
  const [siteOrders, b2bOrders, finance, categories, brands, products] = await Promise.all([
    prisma.siteOrder.findMany({
      select: { items: true, total: true, paymentStatus: true, createdAt: true, status: true, recipientName: true },
    }),
    prisma.order.findMany({
      select: { items: true, total: true, paymentStatus: true, createdAt: true, customer: { select: { id: true, name: true } } },
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

  type SoldItem = { productId: string | null; name: string; qty: number; revenue: number; categoryId: string | null; categoryName: string | null; brandId: string | null; brandName: string | null; orderDate: Date; source: "web" | "manuel" };
  const soldItems: SoldItem[] = [];

  // Müşteri bazlı toplam (id → { name, orderCount, totalSpend })
  const customerMap = new Map<string, { name: string; orderCount: number; totalSpend: number }>();

  for (const order of siteOrders) {
    const items = order.items as { productId?: string; name: string; qty: number; price: number }[];
    for (const item of items) {
      const prod = item.productId ? productMap.get(item.productId) : null;
      soldItems.push({
        productId:    item.productId ?? null,
        name:         item.name,
        qty:          item.qty,
        revenue:      item.price * item.qty,
        categoryId:   prod?.categoryId ?? null,
        categoryName: prod?.category?.name ?? null,
        brandId:      prod?.brandId ?? null,
        brandName:    prod?.brand?.name ?? null,
        orderDate:    order.createdAt,
        source:       "web",
      });
    }
    // Web siparişlerde müşteri kaydı yok, recipientName kullan
    const key = `web-${order.recipientName}`;
    const existing = customerMap.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpend += Number(order.total);
    } else {
      customerMap.set(key, { name: order.recipientName ?? "Bilinmiyor", orderCount: 1, totalSpend: Number(order.total) });
    }
  }

  for (const order of b2bOrders) {
    const items = order.items as { productId?: string; productName?: string; name?: string; quantity?: number; qty?: number; price: number }[];
    for (const item of items) {
      const name = item.productName ?? item.name ?? "—";
      const qty  = item.quantity ?? item.qty ?? 1;
      const prod2 = item.productId ? productMap.get(item.productId) : null;
      soldItems.push({
        productId:    item.productId ?? null,
        name,
        qty,
        revenue:      item.price * qty,
        categoryId:   prod2?.categoryId ?? null,
        categoryName: prod2?.category?.name ?? null,
        brandId:      prod2?.brandId ?? null,
        brandName:    prod2?.brand?.name ?? null,
        orderDate:    order.createdAt,
        source:       "manuel",
      });
    }
    if (order.customer) {
      const key = order.customer.id;
      const existing = customerMap.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpend += Number(order.total);
      } else {
        customerMap.set(key, { name: order.customer.name, orderCount: 1, totalSpend: Number(order.total) });
      }
    }
  }

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.orderCount - a.orderCount || b.totalSpend - a.totalSpend)
    .slice(0, 20);

  return (
    <RaporClient
      soldItems={soldItems.map((i) => ({ ...i, orderDate: i.orderDate.toISOString() }))}
      finance={finance.map((f) => ({ ...f, amount: Number(f.amount), date: f.date.toISOString() }))}
      categories={categories}
      brands={brands}
      topCustomers={topCustomers}
    />
  );
}
