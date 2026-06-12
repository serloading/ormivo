import { auth } from "@/lib/auth";

const stats = [
  { label: "Toplam Ürün", value: "—", sub: "aktif ürün" },
  { label: "Toplam Müşteri", value: "—", sub: "kayıtlı müşteri" },
  { label: "Bekleyen Sipariş", value: "—", sub: "işlem bekliyor" },
  { label: "Bu Ay Gelir", value: "—₺", sub: "net gelir" },
];

export default async function DashboardPage() {
  const session = await auth();

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

      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#e8ddd6] rounded-sm p-6"
          >
            <p className="text-xs tracking-widest text-[#8b6f5e] uppercase mb-3">
              {stat.label}
            </p>
            <p className="text-3xl font-light text-[#2c1810]">{stat.value}</p>
            <p className="text-xs text-[#b8a89e] mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Hızlı erişim */}
      <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
        <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">
          Hızlı İşlemler
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Ürün Ekle", href: "/admin/urunler/yeni" },
            { label: "Sipariş Gir", href: "/admin/siparisler/yeni" },
            { label: "Müşteri Ekle", href: "/admin/musteriler/yeni" },
            { label: "Gelir Gir", href: "/admin/finans/yeni" },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="text-center border border-[#d4c5ba] rounded-sm py-3 px-4 text-xs tracking-wide text-[#5c4033] hover:bg-[#f5f0eb] transition-colors"
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
