import { prisma } from "@/lib/prisma";
import { getDebtStats } from "@/lib/actions/debt";
import BorcAlacakClient from "@/components/admin/BorcAlacakClient";

export const metadata = { title: "Borç/Alacak — Ormivo Admin" };

export default async function BorcAlacakPage() {
  // Telefon normalizasyonu: sadece rakamlar, başındaki 90/0 kaldır
  function normPhone(p: string | null | undefined): string {
    if (!p) return "";
    const digits = p.replace(/\D/g, "");
    if (digits.startsWith("90")) return digits.slice(2);
    if (digits.startsWith("0"))  return digits.slice(1);
    return digits;
  }

  // Tüm CustomerDebt'leri çek (ödenmiş dahil) — orderId eşleşmesi için
  const allDebtsForOrders = await prisma.customerDebt.findMany({
    where:  { orderId: { not: null } },
    select: { orderId: true },
  });
  // B2B sipariş ID'leri (borç kaydı oluşturulmuş tüm siparişler — ödenmiş olsa bile tekrar görünmemeli)
  const debtOrderIds = new Set(allDebtsForOrders.map((d) => d.orderId).filter(Boolean) as string[]);

  // Aktif (ödenmemiş) borçlar — web sipariş telefon filtresi için
  const activeDebts = await prisma.customerDebt.findMany({
    where:  { status: { not: "ODENDI" } },
    select: { orderId: true, customer: { select: { phone: true } } },
  });
  const activeDebtPhones = new Set(activeDebts.map((d) => normPhone(d.customer.phone)).filter(Boolean));

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
    // Web siparişler — müşterisi için aktif CustomerDebt varsa hariç tut
    prisma.siteOrder.findMany({
      where: { paymentStatus: "PENDING", status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, phone: true } } },
    }).then((rows) => rows.filter((o) => {
      const userPhone     = normPhone(o.user?.phone);
      const recipientPhone = normPhone(o.recipientPhone);
      return !activeDebtPhones.has(userPhone) && !activeDebtPhones.has(recipientPhone);
    })),
    // B2B manuel siparişler — CustomerDebt'e bağlı olanları hariç tut
    prisma.order.findMany({
      where: {
        paymentStatus: "PENDING",
        status: { not: "CANCELLED" },
        ...(debtOrderIds.size > 0 ? { id: { notIn: Array.from(debtOrderIds) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { id: true, name: true, phone: true } } },
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
