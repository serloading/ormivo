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

  const [siteOrders, b2bOrders] = await Promise.all([
    prisma.siteOrder.findMany({
      where: statusFilter ? { status: statusFilter as never } : undefined,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { phone: true, name: true } } },
    }),
    prisma.order.findMany({
      where: statusFilter ? { status: statusFilter as never } : undefined,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, phone: true } } },
    }),
  ]);

  // Normalize both into a single shape
  const unified = [
    ...siteOrders.map((o) => ({
      id:            o.id,
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
      note:          o.note,
      trackingNo:    o.trackingNo,
      cargoCompany:  o.cargoCompany,
      paymentStatus:  o.paymentStatus ?? "PENDING",
      deliveryMethod: o.deliveryMethod ?? "CARGO",
      memberName:    o.user?.name ?? null,
      memberPhone:   o.user?.phone ?? null,
    })),
    ...b2bOrders.map((o) => ({
      id:            o.id,
      source:        "manuel" as const,
      orderNo:       o.orderNo,
      status:        o.status,
      createdAt:     o.createdAt.toISOString(),
      recipientName: o.customer.name,
      recipientPhone: o.customer.phone ?? null,
      addressLine:   null,
      city:          null,
      district:      null,
      items:         o.items as { name: string; qty: number; price: number }[],
      total:         Number(o.total),
      note:          o.note,
      trackingNo:    null,
      cargoCompany:  null,
      paymentStatus:  "PENDING",
      deliveryMethod: "PICKUP",
      memberName:    null,
      memberPhone:   null,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return <SiparislerClient orders={unified} />;
}
