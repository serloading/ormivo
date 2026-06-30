import { auth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart  = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const [
    totalProducts,
    totalCustomers,
    pendingOrders,
    monthlyIncome,
    lowStockProducts,
    recentSiteOrders,
    recentB2BOrders,
    weekSiteOrders,
    weekB2BOrders,
    topCustomers,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.customer.count(),
    prisma.siteOrder.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    prisma.finance.aggregate({ where: { createdAt: { gte: monthStart }, type: "INCOME" }, _sum: { amount: true } }),
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null, stock: { lte: 2 } },
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, name: true, stock: true },
    }),
    // Son web siparişleri
    prisma.siteOrder.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, orderNo: true, recipientName: true, total: true, status: true, createdAt: true },
    }),
    // Son B2B siparişleri
    prisma.order.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, orderNo: true, total: true, status: true, createdAt: true, customer: { select: { name: true } } },
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
  ]);

  const income = Number(monthlyIncome._sum.amount ?? 0);

  // Bu hafta ürün bazlı satış toplamı
  type Item = { name: string; qty: number };
  const itemMap = new Map<string, number>();
  const allWeekItems = [
    ...weekSiteOrders.flatMap((o) => (o.items as Item[])),
    ...weekB2BOrders.flatMap((o) => (o.items as Item[])),
  ];
  for (const item of allWeekItems) {
    if (!item?.name) continue;
    itemMap.set(item.name, (itemMap.get(item.name) ?? 0) + (item.qty ?? 1));
  }
  const topProducts = [...itemMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const statusLabels: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: "Hazırlanıyor", cls: "bg-yellow-100 text-yellow-700" },
    SHIPPED:   { label: "Kargoda",      cls: "bg-blue-100 text-blue-700" },
    DELIVERED: { label: "Teslim",       cls: "bg-green-100 text-green-700" },
    CANCELLED: { label: "İptal",        cls: "bg-red-100 text-red-600" },
  };

  // Son 10 sipariş (web + B2B birleşik, tarihe göre)
  const recentOrders = [
    ...recentSiteOrders.map((o) => ({
      id: o.id, orderNo: o.orderNo,
      name: o.recipientName ?? "—",
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt,
      type: "web" as const,
    })),
    ...recentB2BOrders.map((o) => ({
      id: o.id, orderNo: o.orderNo,
      name: o.customer?.name ?? "—",
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt,
      type: "b2b" as const,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6);

  const stats = [
    { label: "Aktif Ürün",       value: totalProducts,                         sub: "yayında",         href: "/admin/urunler",    icon: "◇" },
    { label: "Kayıtlı Müşteri",  value: totalCustomers,                        sub: "toplam müşteri",  href: "/admin/musteriler", icon: "◑" },
    { label: "Açık Sipariş",     value: pendingOrders,                         sub: "işlem bekliyor",  href: "/admin/siparisler", icon: "◎" },
    { label: "Bu Ay Gelir",      value: `${income.toLocaleString("tr-TR")} ₺`, sub: "finans kaydı",   href: "/admin/rapor",       icon: "◉" },
  ];

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div>
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
          Hoş geldiniz, {session?.user?.name ?? "Admin"}
        </h2>
        <p className="text-sm text-[#8b6f5e] mt-1">
          {now.toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stok uyarısı */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">
            ⚠ {lowStockProducts.length} ürünün stoğu kritik seviyede (2 veya altı)
          </p>
          <Link href="/admin/urunler" className="text-xs text-red-700 underline shrink-0">
            Ürünlere git →
          </Link>
        </div>
      )}

      {/* Stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="bg-white border border-[#e8ddd6] rounded-sm p-5 hover:border-[#c4b5aa] transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] tracking-widest text-[#8b6f5e] uppercase">{stat.label}</p>
              <span className="text-[#d4c5ba] text-xs group-hover:text-[#8b6f5e] transition-colors">{stat.icon}</span>
            </div>
            <p className="text-2xl font-light text-[#2c1810] group-hover:text-[#3d2418]">{stat.value}</p>
            <p className="text-[11px] text-[#b8a89e] mt-1">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* Ana içerik grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Son Siparişler — 2 col */}
        <div className="lg:col-span-2 bg-white border border-[#e8ddd6] rounded-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ebe6]">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase">Son Siparişler</h3>
            <Link href="/admin/siparisler?status=ALL" className="text-[11px] text-[#8b6f5e] hover:text-[#2c1810]">Tümü →</Link>
          </div>
          <div className="divide-y divide-[#f0ebe6]">
            {recentOrders.length === 0 ? (
              <p className="px-6 py-8 text-sm text-[#b8a89e] text-center">Henüz sipariş yok.</p>
            ) : recentOrders.map((o) => {
              const s = statusLabels[o.status] ?? { label: o.status, cls: "bg-gray-100 text-gray-600" };
              return (
                <div key={o.id} className="flex items-center px-6 py-3 gap-4 hover:bg-[#faf8f6] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2c1810] truncate">{o.name}</p>
                    <p className="text-[11px] text-[#b8a89e]">
                      #{o.orderNo.slice(-8)} · {o.type === "web" ? "Web" : "B2B"} · {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${s.cls}`}>{s.label}</span>
                  <span className="text-sm font-medium text-[#2c1810] whitespace-nowrap shrink-0">{o.total.toLocaleString("tr-TR")} ₺</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sağ kolon */}
        <div className="space-y-6">

          {/* Bu Hafta En Çok Satanlar */}
          <div className="bg-white border border-[#e8ddd6] rounded-sm">
            <div className="px-5 py-4 border-b border-[#f0ebe6]">
              <h3 className="text-xs tracking-widest text-[#5c4033] uppercase">Bu Hafta En Çok Satan</h3>
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

          {/* En Çok Sipariş Veren Müşteriler */}
          <div className="bg-white border border-[#e8ddd6] rounded-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ebe6]">
              <h3 className="text-xs tracking-widest text-[#5c4033] uppercase">En Sadık Müşteriler</h3>
              <Link href="/admin/musteriler" className="text-[11px] text-[#8b6f5e] hover:text-[#2c1810]">Tümü →</Link>
            </div>
            <div className="divide-y divide-[#f0ebe6]">
              {topCustomers.map((c, i) => {
                const total = (c._count.orders) + (c._count.siteOrders);
                return (
                  <Link key={c.id} href={`/admin/musteriler/${c.id}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-[#faf8f6] transition-colors">
                    <span className="text-[11px] font-bold text-[#d4c5ba] w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2c1810] truncate">{c.name}</p>
                      {c.phone && <p className="text-[10px] text-[#b8a89e]">{c.phone}</p>}
                    </div>
                    <span className="text-[11px] font-semibold text-[#8b6f5e] shrink-0">{total} sipariş</span>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Alt grid: Hızlı İşlemler + Düşük Stok */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">Hızlı İşlemler</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Yeni Ürün Ekle",    href: "/admin/urunler/yeni",    icon: "◇" },
              { label: "Sipariş Yönetimi",  href: "/admin/siparisler",      icon: "◎" },
              { label: "Müşteri Ekle",      href: "/admin/musteriler",      icon: "◑" },
              { label: "Borç / Alacak",     href: "/admin/borc-alacak",     icon: "₺" },
              { label: "Depo Siparişi",     href: "/admin/depo-siparisler", icon: "▣" },
              { label: "Rapor",             href: "/admin/rapor",           icon: "◉" },
            ].map((action) => (
              <Link key={action.href} href={action.href}
                className="flex items-center gap-2 border border-[#d4c5ba] rounded-sm py-3 px-4 text-xs tracking-wide text-[#5c4033] hover:bg-[#f5f0eb] hover:border-[#c4b5aa] transition-colors">
                <span className="text-[10px] text-[#b8a89e]">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase">Kritik Stok</h3>
            <Link href="/admin/urunler" className="text-[11px] text-[#8b6f5e] hover:text-[#2c1810]">Tümü →</Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-[#8b6f5e]">Tüm ürünler yeterli stokta. ✓</p>
          ) : (
            <div className="space-y-2.5">
              {(lowStockProducts as Array<{ id: string; name: string; stock: number }>).map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm text-[#2c1810] truncate flex-1">{p.name}</span>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full ml-3 font-medium shrink-0 ${
                    p.stock === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                  }`}>
                    {p.stock === 0 ? "Tükendi" : `${p.stock} adet`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
