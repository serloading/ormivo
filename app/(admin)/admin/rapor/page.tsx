import { prisma } from "@/lib/prisma";
import RaporClient from "./RaporClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rapor — Admin" };

const CARGO_FEE = 200;

export default async function RaporPage() {
  const [siteOrders, b2bOrders, categories, brands, products] = await Promise.all([
    prisma.siteOrder.findMany({
      select: { id: true, items: true, total: true, discount: true, paymentStatus: true, deliveryMethod: true, createdAt: true, status: true, recipientName: true },
    }),
    prisma.order.findMany({
      select: { id: true, items: true, total: true, paymentStatus: true, deliveryMethod: true, createdAt: true, customer: { select: { id: true, name: true } } },
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      select: { id: true, name: true, costPrice: true, categoryId: true, brandId: true, category: { select: { name: true } }, brand: { select: { name: true } } },
    }),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));

  type SoldItem = {
    productId: string | null; name: string; qty: number;
    originalPrice: number; // item birim fiyatı × qty (indirim uygulanmadan)
    salePrice: number;     // gerçek tahsil edilen (indirim sonrası orantısal)
    costPrice: number;     // maliyet (costPrice × qty)
    categoryId: string | null; categoryName: string | null;
    brandId: string | null; brandName: string | null;
    orderDate: string; source: "web" | "manuel";
    hasCargoFee: boolean;
    orderId: string;
  };

  const soldItems: SoldItem[] = [];
  const customerMap = new Map<string, { name: string; orderCount: number; totalSpend: number }>();

  for (const order of siteOrders) {
    if (order.paymentStatus !== "PAID" && order.paymentStatus !== "FREE") continue;

    const items = order.items as { productId?: string; name: string; qty: number; price: number }[];
    const originalTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = Number(order.discount ?? 0);
    const saleTotal = Math.max(0, Number(order.total) - discount);
    const scale = originalTotal > 0 ? saleTotal / originalTotal : 1;

    for (const item of items) {
      const prod = item.productId ? productMap.get(item.productId) : null;
      const origLine = item.price * item.qty;
      soldItems.push({
        productId:    item.productId ?? null,
        name:         item.name,
        qty:          item.qty,
        originalPrice: origLine,
        salePrice:    Math.round(origLine * scale),
        costPrice:    prod?.costPrice ? Number(prod.costPrice) * item.qty : 0,
        categoryId:   prod?.categoryId ?? null,
        categoryName: prod?.category?.name ?? null,
        brandId:      prod?.brandId ?? null,
        brandName:    prod?.brand?.name ?? null,
        orderDate:    order.createdAt.toISOString(),
        source:       "web",
        hasCargoFee:  order.deliveryMethod === "CARGO",
        orderId:      order.id,
      });
    }

    // cargo fee only on first item to avoid duplication
    const key = `web-${order.recipientName}`;
    const existing = customerMap.get(key);
    if (existing) { existing.orderCount += 1; existing.totalSpend += Math.round(saleTotal); }
    else customerMap.set(key, { name: order.recipientName ?? "Bilinmiyor", orderCount: 1, totalSpend: Math.round(saleTotal) });
  }

  for (const order of b2bOrders) {
    if (order.paymentStatus !== "PAID" && order.paymentStatus !== "FREE") continue;

    const items = order.items as { productId?: string; productName?: string; name?: string; quantity?: number; qty?: number; price: number }[];
    const orderTotal = Number(order.total);

    // İndirim hesabı: sipariş toplam < kalem toplamı ise fark indirimdedir
    const itemsTotal = items.reduce((s, i) => s + i.price * (i.quantity ?? i.qty ?? 1), 0);
    const scale = itemsTotal > 0 ? orderTotal / itemsTotal : 1;

    for (const item of items) {
      const name = item.productName ?? item.name ?? "—";
      const qty  = item.quantity ?? item.qty ?? 1;
      const prod = item.productId ? productMap.get(item.productId) : null;
      const origLine = item.price * qty;
      soldItems.push({
        productId:    item.productId ?? null,
        name,
        qty,
        originalPrice: origLine,
        salePrice:    Math.round(origLine * scale),
        costPrice:    prod?.costPrice ? Number(prod.costPrice) * qty : 0,
        categoryId:   prod?.categoryId ?? null,
        categoryName: prod?.category?.name ?? null,
        brandId:      prod?.brandId ?? null,
        brandName:    prod?.brand?.name ?? null,
        orderDate:    order.createdAt.toISOString(),
        source:       "manuel",
        hasCargoFee:  order.deliveryMethod === "CARGO",
        orderId:      order.id,
      });
    }

    if (order.customer) {
      const key = order.customer.id;
      const existing = customerMap.get(key);
      if (existing) { existing.orderCount += 1; existing.totalSpend += Math.round(orderTotal); }
      else customerMap.set(key, { name: order.customer.name, orderCount: 1, totalSpend: Math.round(orderTotal) });
    }
  }

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.orderCount - a.orderCount || b.totalSpend - a.totalSpend)
    .slice(0, 20);

  return (
    <RaporClient
      soldItems={soldItems}
      categories={categories}
      brands={brands}
      topCustomers={topCustomers}
      cargoFee={CARGO_FEE}
    />
  );
}
