import { auth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDebtStats } from "@/lib/actions/debt";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalProducts,
    totalCustomers,
    totalDealers,
    todaySiteOrders,
    todayB2BOrders,
    monthSiteOrders,
    monthB2BOrders,
    monthTopCustomers,
    debtStats,
    pendingSiteOrders,
    pendingB2BOrders,
    supplierDebtTotal,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.siteUser.count(),
    prisma.siteUser.count({ where: { isB2BApproved: true } }),
    prisma.siteOrder.findMany({
      where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    prisma.siteOrder.findMany({
      where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
      select: { items: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
      select: { items: true },
    }),
    prisma.customer.findMany({
      take: 6,
      orderBy: { siteOrders: { _count: "desc" } },
      select: { id: true, name: true, phone: true, _count: { select: { orders: true, siteOrders: true } } },
    }),
    getDebtStats(),
    prisma.siteOrder.findMany({
      where: { paymentStatus: "PENDING", status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PENDING", status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    prisma.supplierDebt.aggregate({
      where: { status: { not: "ODENDI" } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
  ]);

  const todayOrderCount = todaySiteOrders.length + todayB2BOrders.length;
  const todayRevenue =
    todaySiteOrders.reduce((s, o) => s + Number(o.total), 0) +
    todayB2BOrders.reduce((s, o) => s + Number(o.total), 0);

  const pendingOrdersTotal =
    pendingSiteOrders.reduce((s, o) => s + Number(o.total), 0) +
    pendingB2BOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalReceivable = debtStats.totalReceivable + pendingOrdersTotal;
  const supplierOwed =
    Number(supplierDebtTotal._sum.totalAmount ?? 0) -
    Number(supplierDebtTotal._sum.paidAmount ?? 0);

  // Bu ay ürün bazlı satış
  type Item = { name: string; qty: number };
  const itemMap = new Map<string, number>();
  for (const o of [...monthSiteOrders, ...monthB2BOrders]) {
    for (const item of (o.items as Item[])) {
      if (!item?.name) continue;
      itemMap.set(item.name, (itemMap.get(item.name) ?? 0) + (item.qty ?? 1));
    }
  }
  const topProducts = [...itemMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const stats = [
    { label: "Aktif Ürün",      value: totalProducts,  sub: "yayında",         href: "/admin/urunler",    icon: "◇" },
    { label: "Kayıtlı Müşteri", value: totalCustomers, sub: "üye",             href: "/admin/musteriler", icon: "◑" },
    { label: "Kayıtlı Bayi",    value: totalDealers,   sub: "onaylı bayi",     href: "/admin/bayiler",    icon: "◈" },
  ];

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
            Hoş geldiniz, {session?.user?.name ?? "Admin"}
          </h2>
          <p className="text-sm text-[#8b6f5e] mt-0.5">
            {now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Stat kartları — 3 kart */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="bg-white border border-[#e8ddd6] rounded-sm p-5 hover:border-[#c4b5aa] transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] tracking-widest text-[#8b6f5e] uppercase">{stat.label}</p>
              <span className="text-xs text-[#d4c5ba] group-hover:text-[#8b6f5e] transition-colors">{stat.icon}</span>
            </div>
            <p className="text-2xl font-light text-[#2c1810]">{stat.value}</p>
            <p className="text-[11px] text-[#b8a89e] mt-1">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* Bugün + Borç/Alacak yan yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
          <p className="text-[10px] tracking-widest text-[#8b6f5e] uppercase mb-4">Bugün</p>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-4xl font-light text-[#2c1810]">{todayOrderCount}</p>
              <p className="text-xs text-[#b8a89e] mt-1">sipariş</p>
            </div>
            <div className="pb-1">
              <p className="text-xl font-light text-[#5c4033]">{todayRevenue.toLocaleString("tr-TR")} ₺</p>
              <p className="text-xs text-[#b8a89e] mt-1">ciro</p>
            </div>
          </div>
          {todayOrderCount === 0 && (
            <p className="text-xs text-[#b8a89e] mt-3">Bugün henüz sipariş gelmedi.</p>
          )}
        </div>

        <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] tracking-widest text-[#8b6f5e] uppercase">Borç / Alacak</p>
            <Link href="/admin/borc-alacak" className="text-[11px] text-[#8b6f5e] hover:text-[#2c1810]">Detay →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-[#8b6f5e] mb-1">Müşteri Alacağı</p>
              <p className="text-xl font-light text-green-700">{totalReceivable.toLocaleString("tr-TR")} ₺</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8b6f5e] mb-1">Tedarikçi Borcu</p>
              <p className="text-xl font-light text-red-600">{supplierOwed.toLocaleString("tr-TR")} ₺</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bu Ay En Çok Satan + Bu Ay En Çok Sipariş Verenler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bu Ay En Çok Satan */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm">
          <div className="px-5 py-4 border-b border-[#f0ebe6]">
            <h3 className="text-[10px] tracking-widest text-[#5c4033] uppercase">Bu Ay En Çok Satan</h3>
          </div>
          <div className="divide-y divide-[#f0ebe6]">
            {topProducts.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#b8a89e] text-center">Bu ay sipariş yok.</p>
            ) : topProducts.map(([name, qty], i) => (
              <div key={name} className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-[11px] font-bold text-[#d4c5ba] w-4 shrink-0">{i + 1}</span>
                <p className="flex-1 text-sm text-[#2c1810] truncate" title={name}>{name}</p>
                <span className="text-[11px] font-semibold text-[#8b6f5e] shrink-0">{qty} adet</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bu Ay En Çok Sipariş Verenler */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ebe6]">
            <h3 className="text-[10px] tracking-widest text-[#5c4033] uppercase">Bu Ay En Çok Sipariş Verenler</h3>
            <Link href="/admin/musteriler" className="text-[11px] text-[#8b6f5e] hover:text-[#2c1810]">Tümü →</Link>
          </div>
          <div className="divide-y divide-[#f0ebe6]">
            {monthTopCustomers.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#b8a89e] text-center">Bu ay sipariş yok.</p>
            ) : monthTopCustomers.map((c, i) => {
              const total = c._count.orders + c._count.siteOrders;
              return (
                <Link key={c.id} href={`/admin/musteriler/${c.id}`}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-[#faf8f6] transition-colors">
                  <span className="text-[11px] font-bold text-[#d4c5ba] w-4 shrink-0">{i + 1}</span>
                  <p className="flex-1 text-sm text-[#2c1810] truncate">{c.name}</p>
                  <span className="text-[11px] font-semibold text-[#8b6f5e] shrink-0">{total} sipariş</span>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
