import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { phoneLookupVariants } from "@/lib/phone";
import { normalizeOrderItems } from "@/lib/order-items";
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
          siteOrders: { orderBy: { createdAt: "desc" }, select: { id: true, orderNo: true, status: true, paymentStatus: true, total: true, createdAt: true, recipientName: true, city: true, items: true } },
          _count: { select: { siteOrders: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) notFound();

  // Referral siparişlerini düzleştir (isim etiketiyle)
  const referralOrders = user.referrals.flatMap((r) =>
    r.siteOrders.map((o) => ({ ...o, referralName: r.name ?? r.phone }))
  );

  // CRM (admin Order) siparişleri — eski siparişler (tüm eşleşen Customer kayıtları)
  const crmOrders = user.phone
    ? await (async () => {
        const variants = phoneLookupVariants(user.phone);
        // İsme göre de ara (telefon kaydedilmemiş olabilir)
        const customers = await prisma.customer.findMany({
          where: {
            OR: [
              { phone: { in: variants } },
              ...(user.name ? [{ name: user.name }] : []),
            ],
          },
          select: { id: true },
        });
        if (!customers.length) return [];
        const custIds = customers.map((c) => c.id);
        return prisma.order.findMany({
          where: { customerId: { in: custIds } },
          orderBy: { createdAt: "desc" },
          select: { id: true, orderNo: true, status: true, total: true, createdAt: true, items: true },
        });
      })()
    : [];

  // Aynı telefonla farklı hesapla verilmiş SiteOrder'lar (misafir çıkış veya eski hesap)
  const phoneOrders = user.phone
    ? await prisma.siteOrder.findMany({
        where: {
          recipientPhone: { in: phoneLookupVariants(user.phone) },
          OR: [{ userId: null }, { userId: { not: user.id } }],
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNo: true, status: true, paymentStatus: true, total: true, createdAt: true, recipientName: true, city: true, items: true },
      })
    : [];

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

  // Top products: aggregate SiteOrder + phone-matched SiteOrders + CRM Order items JSON
  const productMap = new Map<string, { name: string; qty: number; total: number }>();
  for (const order of [...user.siteOrders, ...phoneOrders, ...crmOrders]) {
    const rawItems = normalizeOrderItems(order.items);
    for (const item of rawItems) {
      const key = item.name ?? "unknown";
      const existing = productMap.get(key);
      if (existing) {
        existing.qty += item.qty;
        existing.total += item.price * item.qty;
      } else {
        productMap.set(key, { name: item.name, qty: item.qty, total: item.price * item.qty });
      }
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Stats — kendi + phone eşleşmeli + referral + CRM siparişleri
  const allOrders = [...user.siteOrders, ...phoneOrders, ...referralOrders, ...crmOrders];
  const totalSpend = allOrders.reduce((s, o) => s + Number(o.total), 0);
  const pendingPayment = allOrders
    .filter((o) => ("paymentStatus" in o ? o.paymentStatus !== "PAID" : false))
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
        stats={{ totalSpend, pendingPayment, totalDebt, orderCount: allOrders.length, referralCount: user.referrals.length }}
        orders={[
          ...user.siteOrders.map((o) => ({
            id: o.id, orderNo: o.orderNo, status: o.status, paymentStatus: o.paymentStatus,
            total: Number(o.total), createdAt: o.createdAt,
            recipientName: o.recipientName, city: o.city,
            items: o.items as OrderItem[], referralName: null as string | null,
          })),
          ...referralOrders.map((o) => ({
            id: o.id, orderNo: o.orderNo, status: o.status, paymentStatus: o.paymentStatus,
            total: Number(o.total), createdAt: o.createdAt,
            recipientName: o.recipientName, city: o.city,
            items: o.items as OrderItem[], referralName: o.referralName,
          })),
          ...phoneOrders.map((o) => ({
            id: o.id, orderNo: o.orderNo, status: o.status, paymentStatus: o.paymentStatus,
            total: Number(o.total), createdAt: o.createdAt,
            recipientName: o.recipientName, city: o.city,
            items: o.items as OrderItem[], referralName: null as string | null,
          })),
          ...crmOrders.map((o) => ({
            id: o.id, orderNo: o.orderNo, status: o.status, paymentStatus: "PAID",
            total: Number(o.total), createdAt: o.createdAt,
            recipientName: null, city: null,
            items: o.items as OrderItem[], referralName: null as string | null,
          })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
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
