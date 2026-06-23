import { auth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalProducts, totalCustomers, pendingOrders, monthlyIncome, lowStockProducts] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true, deletedAt: null } }),
      prisma.customer.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.finance.aggregate({ where: { createdAt: { gte: monthStart }, type: "GELIR" }, _sum: { amount: true } }),
      prisma.product.findMany({
        where: { isActive: true, deletedAt: null, stock: { lt: 5 } },
        orderBy: { stock: "asc" },
        take: 4,
        select: { id: true, name: true, stock: true },
      }),
    ]);

  const income = Number(monthlyIncome._sum.amount ?? 0);

  const stats = [
    { label: "Aktif Ürün",      value: totalProducts,                          sub: "yayında",        href: "/admin/urunler" },
    { label: "Kayıtlı Müşteri", value: totalCustomers,                         sub: "toplam müşteri", href: "/admin/musteriler" },
    { label: "Bekleyen Sipariş",value: pendingOrders,                          sub: "işlem bekliyor", href: "/admin/siparisler" },
    { label: "Bu Ay Gelir",     value: `${income.toLocaleString("tr-TR")} ₺`,  sub: "net gelir",      href: "/admin/finans" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
          Hoş geldiniz, {session?.user?.name ?? "Admin"}
        </h2>
        <p className="text-sm text-[#8b6f5e] mt-1">
          Ormivo yönetim paneline hoş geldiniz.
        </p>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-sm p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-orange-700">
            ⚠ {lowStockProducts.length} ürün düşük stokta
          </p>
          <Link href="/admin/stok" className="text-xs text-orange-700 underline">
            Stok sayfasına git
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="bg-white border border-[#e8ddd6] rounded-sm p-6 hover:border-[#c4b5aa] transition-colors group">
            <p className="text-xs tracking-widest text-[#8b6f5e] uppercase mb-3">{stat.label}</p>
            <p className="text-3xl font-light text-[#2c1810] group-hover:text-[#3d2418]">{stat.value}</p>
            <p className="text-xs text-[#b8a89e] mt-1">{stat.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">Hızlı İşlemler</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Ürün Ekle",   href: "/admin/urunler/yeni" },
              { label: "Sipariş Gir", href: "/admin/siparisler" },
              { label: "Müşteri Ekle",href: "/admin/musteriler" },
              { label: "Gelir Gir",   href: "/admin/finans" },
            ].map((action) => (
              <Link key={action.href} href={action.href}
                className="text-center border border-[#d4c5ba] rounded-sm py-3 px-4 text-xs tracking-wide text-[#5c4033] hover:bg-[#f5f0eb] transition-colors">
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">Düşük Stok</h3>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-[#8b6f5e]">Tüm ürünler yeterli stokta.</p>
          ) : (
            <div className="space-y-3">
              {(lowStockProducts as Array<{ id: string; name: string; stock: number }>).map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm text-[#2c1810]">{p.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.stock === 0 ? "bg-red-100 text-red-600" :
                    p.stock < 5  ? "bg-orange-100 text-orange-600" :
                                   "bg-green-100 text-green-700"
                  }`}>
                    {p.stock} adet
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/stok" className="block mt-4 text-xs text-[#8b6f5e] hover:text-[#2c1810] transition-colors">
            Tümünü gör →
          </Link>
        </div>
      </div>
    </div>
  );
}
