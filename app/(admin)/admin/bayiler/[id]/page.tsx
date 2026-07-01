import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { phoneLookupVariants } from "@/lib/phone";
import BayiDetailClient from "@/components/admin/BayiDetailClient";

export const dynamic = "force-dynamic";

type OrderItem = { productId?: string; name?: string; qty?: number; quantity?: number; price?: number; image?: string };

export default async function BayiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.siteUser.findUnique({
    where: { id },
    include: {
      siteOrders: { orderBy: { createdAt: "desc" } },
      referrals: {
        select: {
          id: true, name: true, phone: true, email: true, segment: true, createdAt: true,
          _count: { select: { siteOrders: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) notFound();

  // Borç/alacak: Customer lookup by phone
  const customer = user.phone
    ? await prisma.customer.findFirst({
        where: { phone: { in: phoneLookupVariants(user.phone) } },
        include: {
          debts: {
            include: { payments: true, order: { select: { orderNo: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      })
    : null;

  // Top products: aggregate SiteOrder.items JSON
  const productMap = new Map<string, { name: string; qty: number; total: number }>();
  for (const order of user.siteOrders) {
    const items = (order.items as OrderItem[]) ?? [];
    for (const item of items) {
      const key = item.productId ?? item.name ?? "unknown";
      const qty = item.qty ?? item.quantity ?? 1;
      const price = item.price ?? 0;
      const existing = productMap.get(key);
      if (existing) {
        existing.qty += qty;
        existing.total += price * qty;
      } else {
        productMap.set(key, { name: item.name ?? key, qty, total: price * qty });
      }
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Stats
  const totalSpend = user.siteOrders.reduce((s, o) => s + Number(o.total), 0);
  const pendingPayment = user.siteOrders
    .filter((o) => o.paymentStatus !== "PAID")
    .reduce((s, o) => s + Number(o.total), 0);
  const totalDebt = customer?.debts.reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0) ?? 0;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/bayiler" className="text-xs text-[#8b6f5e] hover:text-[#2c1810] flex items-center gap-1">
          ← Bayi Yönetimi
        </Link>
      </div>

      <BayiDetailClient
        user={{
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          segment: user.segment,
          isB2B: user.isB2B,
          isB2BApproved: user.isB2BApproved,
          b2bMarkup: user.b2bMarkup != null ? Number(user.b2bMarkup) : null,
          b2bNote: user.b2bNote,
          referralCode: user.referralCode,
          createdAt: user.createdAt,
        }}
        stats={{ totalSpend, pendingPayment, totalDebt, orderCount: user.siteOrders.length, referralCount: user.referrals.length }}
        orders={user.siteOrders.map((o) => ({
          id: o.id, orderNo: o.orderNo, status: o.status, paymentStatus: o.paymentStatus,
          total: Number(o.total), createdAt: o.createdAt,
          recipientName: o.recipientName, city: o.city,
          items: o.items as OrderItem[],
        }))}
        debts={(customer?.debts ?? []).map((d) => ({
          id: d.id, description: d.description, totalAmount: d.totalAmount,
          paidAmount: d.paidAmount, status: d.status, dueDate: d.dueDate,
          createdAt: d.createdAt, orderNo: d.order?.orderNo ?? null,
          payments: d.payments.map((p) => ({ id: p.id, amount: p.amount, note: p.note, paidAt: p.paidAt })),
        }))}
        referrals={user.referrals.map((r) => ({
          id: r.id, name: r.name, phone: r.phone, email: r.email,
          segment: r.segment, createdAt: r.createdAt, orderCount: r._count.siteOrders,
        }))}
        topProducts={topProducts}
      />
    </div>
  );
}
