import { prisma } from "@/lib/prisma";
import { getDebtStats } from "@/lib/actions/debt";
import BorcAlacakClient from "@/components/admin/BorcAlacakClient";

export const metadata = { title: "Borç/Alacak — Ormivo Admin" };

export default async function BorcAlacakPage() {
  const [customerDebts, supplierDebts, customers, orders, stats] = await Promise.all([
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
  ]);

  // Geçmiş tedarikçi adları (autocomplete için)
  const supplierNames: string[] = Array.from(new Set<string>(supplierDebts.map((d) => (d as { supplierName: string }).supplierName))).sort();

  return (
    <BorcAlacakClient
      customerDebts={customerDebts as never}
      supplierDebts={supplierDebts as never}
      customers={customers}
      orders={orders}
      supplierNames={supplierNames}
      stats={stats}
    />
  );
}
