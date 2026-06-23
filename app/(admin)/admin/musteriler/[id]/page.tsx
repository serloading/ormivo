import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerById } from "@/lib/actions/customer";
import MusteriProfilClient from "@/components/admin/MusteriProfilClient";

export const dynamic = "force-dynamic";

export default async function MusteriProfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  // Tüm siparişleri birleştir ve sırala
  const orders = [
    ...customer.orders.map((o) => ({
      id:        o.id,
      orderNo:   o.orderNo,
      source:    "manuel" as const,
      status:    o.status,
      total:     Number(o.total),
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    })),
    ...customer.siteOrders.map((o) => ({
      id:        o.id,
      orderNo:   o.orderNo,
      source:    "web" as const,
      status:    o.status,
      total:     Number(o.total),
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalSpend = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((s, o) => s + o.total, 0);

  const serialized = {
    id:        customer.id,
    name:      customer.name,
    phone:     customer.phone,
    email:     customer.email,
    city:      customer.city,
    note:      customer.note,
    segment:   customer.segment,
    tags:      customer.tags,
    notes:     customer.notes.map((n) => ({
      id:        n.id,
      content:   n.content,
      createdBy: n.createdBy,
      createdAt: n.createdAt.toISOString(),
    })),
    createdAt: customer.createdAt.toISOString(),
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/musteriler" className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">← Müşteriler</Link>
        <span className="text-[#d4c5ba]">/</span>
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">{customer.name}</h2>
      </div>
      <MusteriProfilClient customer={serialized} orders={orders} totalSpend={totalSpend} />
    </div>
  );
}
