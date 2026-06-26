import { prisma } from "@/lib/prisma";
import { getDebtStats } from "@/lib/actions/debt";
import BorcAlacakClient from "@/components/admin/BorcAlacakClient";

export const metadata = { title: "Borç/Alacak — Ormivo Admin" };

export default async function BorcAlacakPage() {
  // Aktif borcu olan müşterilerin telefonlarını bul (web alacaklardan çıkarmak için)
  const activeDebtPhones = await prisma.customerDebt
    .findMany({
      where:  { status: { not: "ODENDI" } },
      select: { customer: { select: { phone: true } } },
    })
    .then((rows) => new Set(rows.map((r) => r.customer.phone).filter(Boolean) as string[]));

  const [customerDebts, supplierDebts, customers, orders, stats, pendingSiteOrders, pendingB2BOrders] = await Promise.all([
    prisma.customerDebt.findMany({
      include: { customer: true, order: true, payments: { orderBy: { paidAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplierDebt.findMany({
      include: { payments: { orderBy: { paidAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, orderNo: true }, take: 100 }),
    getDebtStats(),
    prisma.siteOrder.findMany({
      where: {
        paymentStatus: "PENDING",
        status: { not: "CANCELLED" },
        // Müşterisi için zaten CustomerDebt açılmışsa buraya alma
        user: activeDebtPhones.size > 0
          ? { phone: { notIn: Array.from(activeDebtPhones) } }
          : undefined,
      },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, phone: true } } },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PENDING", status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, phone: true } } },
    }),
  ]);

  const rawNames = (supplierDebts as Array<{ supplierName: string }>).map((d) => d.supplierName);
  const supplierNames: string[] = Array.from(new Set<string>(rawNames)).sort();

  return (
    <BorcAlacakClient
      customerDebts={customerDebts as never}
      supplierDebts={supplierDebts as never}
      customers={customers}
      orders={orders}
      supplierNames={supplierNames}
      stats={stats}
      pendingSiteOrders={pendingSiteOrders as never}
      pendingB2BOrders={pendingB2BOrders as never}
    />
  );
}
