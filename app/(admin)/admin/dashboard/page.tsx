import { auth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDebtStats } from "@/lib/actions/debt";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart  = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const [
    totalProducts,
    totalCustomers,
    pendingOrders,
    lowStockProducts,
    todaySiteOrders,
    todayB2BOrders,
    weekSiteOrders,
    weekB2BOrders,
    topCustomers,
    debtStats,
    pendingSiteOrders,
    pendingB2BOrders,
    supplierDebtTotal,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.customer.count(),
    prisma.siteOrder.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null, stock: { lte: 2 } },
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, name: true, stock: true },
    }),
    // Bugünkü web siparişleri
    prisma.siteOrder.findMany({
      where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    // Bugünkü B2B siparişleri
    prisma.order.findMany({
      where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    // Bu hafta web siparişleri (ürün satış hesabı için)
    prisma.siteOrder.findMany({
      where: { createdAt: { gte: weekStart }, status: { not: "CANCELLED" } },
      select: { items: true },
    }),
    // Bu hafta B2B siparişleri
    prisma.order.findMany({
      where: { createdAt: { gte: weekStart }, status: { not: "CANCELLED" } },
      select: { items: true },
    }),
    // En çok sipariş veren müşteriler
    prisma.customer.findMany({
      take: 5,
      orderBy: { orders: { _count: "desc" } },
      select: { id: true, name: true, phone: true, _count: { select: { orders: true, siteOrders: true } } },
    }),
    getDebtStats(),
    // Pending web siparişler (alacak hesabı için)
    prisma.siteOrder.findMany({
      where: { paymentStatus: "PENDING", status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    // Pending B2B siparişler
    prisma.order.findMany({
      where: { paymentStatus: "PENDING", status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    // Tedarikçi borcu toplamı
    prisma.supplierDebt.aggregate({
      where: { status: { not: "ODENDI" } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
  ]);

  // Bugünün özeti
  const todayOrderCount = todaySiteOrders.length + todayB2BOrders.length;
  const todayRevenue =
    todaySiteOrders.reduce((s, o) => s + Number(o.total), 0) +
    todayB2BOrders.reduce((s, o) => s + Number(o.total), 0);

  // Borç/Alacak özeti
  const pendingOrdersTotal =
    pendingSiteOrders.reduce((s, o) => s + Number(o.total), 0) +
    pendingB2BOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalReceivable = debtStats.totalReceivable + pendingOrdersTotal;
  const supplierOwed =
    Number(supplierDebtTotal._sum.totalAmount ?? 0) -
    Number(supplierDebtTotal._sum.paidAmount ?? 0);

  // Bu hafta ürün bazlı satış
  type Item = { name: string; qty: number };
  const itemMap = new Map<string, number>();
  for (const o of [...weekSiteOrders, ...weekB2BOrders]) {
    for (const item of (o.items as Item[])) {
      if (!item?.name) continue;
      itemMap.set(item.name, (itemMap.get(item.name) ?? 0) + (item.qty ?? 1));
    }
  }
  const topProducts = [...itemMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const stats = [
    { label: "Açık Sipariş",    value: pendingOrders,  sub: "işlem bekliyor", href: "/admin/siparisler", icon: "◎", urgent: pendingOrders > 0 },
    { label: "Aktif Ürün",      value: totalProducts,  sub: "yayında",        href: "/admin/urunler",    icon: "◇", urgent: false },
    { label: "Kayıtlı Müşteri", value: totalCustomers, sub: "toplam",         href: "/admin/musteriler", icon: "◑", urgent: false },
    { label: "Kritik Stok",     value: lowStockProducts.length, sub: "ürün azaldı", href: "/admin/urunler", icon: "▲", urgent: lowStockProducts.length > 0 },
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

      {/* Stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className={`bg-white border rounded-sm p-5 hover:border-[#c4b5aa] transition-colors group ${stat.urgent && stat.value > 0 ? "border-[#c4b5aa]" : "border-[#e8ddd6]"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] tracking-widest text-[#8b6f5e] uppercase">{stat.label}</p>
              <span className={`text-xs transition-colors ${stat.urgent && stat.value > 0 ? "text-[#8b6f5e]" : "text-[#d4c5ba] group-hover:text-[#8b6f5e]"}`}>{stat.icon}</span>
            </div>
            <p className={`text-2xl font-light ${stat.urgent && stat.value > 0 ? "text-[#c0392b]" : "text-[#2c1810]"}`}>{stat.value}</p>
            <p className="text-[11px] text-[#b8a89e] mt-1">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* Bugün + Borç/Alacak yan yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bugünün özeti */}
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

        {/* Borç / Alacak özeti */}
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

      {/* Alt grid: En çok satan + En sadık müşteriler + Hızlı İşlemler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bu Hafta En Çok Satan */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm">
          <div className="px-5 py-4 border-b border-[#f0ebe6]">
            <h3 className="text-[10px] tracking-widest text-[#5c4033] uppercase">Bu Hafta En Çok Satan</h3>
          </div>
          <div className="divide-y divide-[#f0ebe6]">
            {topProducts.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#b8a89e] text-center">Bu hafta sipariş yok.</p>
            ) : topProducts.map(([name, qty], i) => (
              <div key={name} className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-[11px] font-bold text-[#d4c5ba] w-4 shrink-0">{i + 1}</span>
                <p className="flex-1 text-sm text-[#2c1810] truncate" title={name}>{name}</p>
                <span className="text-[11px] font-semibold text-[#8b6f5e] shrink-0">{qty} adet</span>
              </div>
            ))}
          </div>
        </div>

        {/* En Sadık Müşteriler */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ebe6]">
            <h3 className="text-[10px] tracking-widest text-[#5c4033] uppercase">En Sadık Müşteriler</h3>
            <Link href="/admin/musteriler" className="text-[11px] text-[#8b6f5e] hover:text-[#2c1810]">Tümü →</Link>
          </div>
          <div className="divide-y divide-[#f0ebe6]">
            {topCustomers.map((c, i) => {
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

        {/* Hızlı İşlemler + Kritik Stok */}
        <div className="space-y-4">
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-5">
            <h3 className="text-[10px] tracking-widest text-[#5c4033] uppercase mb-3">Hızlı İşlemler</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Yeni Ürün",      href: "/admin/urunler/yeni" },
                { label: "Siparişler",     href: "/admin/siparisler" },
                { label: "Borç/Alacak",   href: "/admin/borc-alacak" },
                { label: "Depo Siparişi", href: "/admin/depo-siparisler" },
              ].map((a) => (
                <Link key={a.href} href={a.href}
                  className="border border-[#d4c5ba] rounded-sm py-2.5 px-3 text-[11px] tracking-wide text-[#5c4033] hover:bg-[#f5f0eb] hover:border-[#c4b5aa] transition-colors text-center">
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {lowStockProducts.length > 0 && (
            <div className="bg-white border border-red-200 rounded-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] tracking-widest text-red-600 uppercase">Kritik Stok</h3>
                <Link href="/admin/urunler" className="text-[11px] text-red-500 hover:text-red-700">Tümü →</Link>
              </div>
              <div className="space-y-2">
                {(lowStockProducts as Array<{ id: string; name: string; stock: number }>).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-[11px] text-[#2c1810] truncate flex-1">{p.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ml-2 font-medium shrink-0 ${p.stock === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                      {p.stock === 0 ? "Tükendi" : `${p.stock} adet`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
