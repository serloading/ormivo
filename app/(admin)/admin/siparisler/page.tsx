import { prisma } from "@/lib/prisma";
import SiparislerClient from "./SiparislerClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Siparişler — Admin" };

export default async function SiparislerPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status ?? null;

  // ALL = tüm siparişler, boş = aktif (DELIVERED ve CANCELLED hariç)
  const activeFilter =
    statusFilter === "ALL"
      ? ({} as never)
      : statusFilter
      ? ({ status: statusFilter } as never)
      : ({ status: { notIn: ["DELIVERED", "CANCELLED"] } } as never);

  const [siteOrders, b2bOrders, customers, products, categories, brands] = await Promise.all([
    prisma.siteOrder.findMany({
      where: activeFilter,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { phone: true, name: true } } },
    }),
    prisma.order.findMany({
      where: activeFilter,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        cargo: { select: { trackingNo: true, company: true } },
      },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, price: true, stock: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Normalize both into a single shape
  const unified = [
    ...siteOrders.map((o) => ({
      id:            o.id,
      customerId:    null,
      source:        "web" as const,
      orderNo:       o.orderNo,
      status:        o.status,
      createdAt:     o.createdAt.toISOString(),
      recipientName: o.recipientName,
      recipientPhone: o.recipientPhone,
      addressLine:   o.addressLine,
      city:          o.city,
      district:      o.district,
      items:         o.items as { name: string; qty: number; price: number }[],
      total:         Number(o.total),
      discount:      Number(o.discount ?? 0),
      note:          o.note,
      trackingNo:    o.trackingNo,
      cargoCompany:  o.cargoCompany,
      paymentStatus:  o.paymentStatus ?? "PENDING",
      deliveryMethod: o.deliveryMethod ?? "CARGO",
      memberName:    o.user?.name ?? null,
      memberPhone:   o.user?.phone ?? null,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(b2bOrders as any[]).map((o) => ({
      id:            o.id,
      source:        "manuel" as const,
      orderNo:       o.orderNo,
      status:        o.status,
      createdAt:     o.createdAt.toISOString(),
      customerId:    o.customerId ?? null,
      recipientName: o.customer?.name ?? "Silinmiş Müşteri",
      recipientPhone: o.customer?.phone ?? null,
      addressLine:   null,
      city:          null,
      district:      null,
      items:         o.items as { name: string; qty: number; price: number }[],
      total:         Number(o.total),
      discount:      0,
      note:          o.note,
      trackingNo:    o.cargo?.trackingNo ?? null,
      cargoCompany:  o.cargo?.company ?? null,
      paymentStatus:  o.paymentStatus ?? "PENDING",
      deliveryMethod: o.deliveryMethod ?? "PICKUP",
      memberName:    null,
      memberPhone:   null,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return <SiparislerClient orders={unified} customers={customers} products={products.map(p => ({ ...p, price: Number(p.price) }))} categories={categories} brands={brands} />;
}
