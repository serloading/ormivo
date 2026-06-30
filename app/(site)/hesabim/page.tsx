import { redirect }         from "next/navigation";
import { getSession }        from "@/lib/session";
import { prisma }            from "@/lib/prisma";
import Image                 from "next/image";
import Link                  from "next/link";
import AddressActions        from "./AddressActions";
import AdminAddressActions   from "./AdminAddressActions";
import HesabimProfileCard    from "./HesabimProfileCard";
import HesabimSiparisler     from "./HesabimSiparisler";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hesabım — Ormivo" };

interface UserAddress {
  id: string; recipientName: string; phone: string;
  addressLine: string; city: string; district: string | null; isDefault: boolean;
}

export default async function HesabimPage() {
  const session = await getSession();
  if (!session) redirect("/giris");

  const [user, siteOrders, allSiteOrders, favoriteLists, favoriteCount] = await Promise.all([
    prisma.siteUser.findUnique({
      where:   { id: session.userId },
      include: { addresses: { orderBy: { isDefault: "desc" } } },
    }),
    prisma.siteOrder.findMany({
      where:   { userId: session.userId, status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      take:    20,
      select: {
        id: true, orderNo: true, createdAt: true, status: true,
        items: true, total: true, discount: true,
        trackingNo: true, cargoCompany: true,
      },
    }),
    prisma.siteOrder.findMany({
      where:  { userId: session.userId, status: { not: "CANCELLED" } },
      select: { items: true, total: true, discount: true },
    }),
    prisma.favoriteList.findMany({
      where:   { userId: session.userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.count({ where: { userId: session.userId } }),
  ]);

  if (!user) redirect("/giris");

  const customer = await prisma.customer.findFirst({
    where: { phone: user.phone },
    include: {
      debts: { where: { status: { not: "ODENDI" } }, orderBy: { createdAt: "desc" } },
      orders: {
        where:   { status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
        take:    20,
        select: { id: true, orderNo: true, createdAt: true, status: true, items: true, total: true },
      },
    },
  });

  // Admin siparişlerini (Order) HesabimSiparisler formatına uyarla
  const adminOrders = (customer?.orders ?? []).map((o) => ({
    id:           o.id,
    orderNo:      o.orderNo,
    createdAt:    o.createdAt,
    status:       o.status as string,
    items:        o.items,
    total:        o.total,
    discount:     null,
    trackingNo:   null as string | null,
    cargoCompany: null as string | null,
    source:       "admin" as const,
  }));

  // Web siparişleri
  const orders = [
    ...siteOrders.map((o) => ({ ...o, source: "web" as const })),
    ...adminOrders.filter((ao) => !siteOrders.some((so) => so.orderNo === ao.orderNo)),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  type OrderItem = { qty?: number; quantity?: number; price: number };
  const totalOriginal = allSiteOrders.reduce((sum, o) => {
    const items = o.items as OrderItem[];
    return sum + items.reduce((s, i) => s + (i.qty ?? i.quantity ?? 1) * i.price, 0);
  }, 0);
  const totalPaid     = allSiteOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalDiscount = Math.max(0, totalOriginal - totalPaid);
  const debts = customer?.debts ?? [];

  // Favori listelerindeki ürünlerin önizlemesi (her listeden ilk görsel)
  const allProductIds = [...new Set(favoriteLists.flatMap((l) => l.productIds.slice(0, 4)))];
  const previewProducts = allProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: allProductIds }, deletedAt: null },
        select: { id: true, images: true, name: true, slug: true },
      })
    : [];
  const previewMap = new Map(previewProducts.map((p) => [p.id, p]));

  const initials = (user.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-6">

        {/* ── Profil Kartı (düzenleme + şifre değiştirme dahil) ── */}
        <HesabimProfileCard
          name={user.name ?? ""}
          phone={user.phone}
          email={(user as { email?: string | null }).email ?? null}
          segment={session.segment ?? null}
          initials={initials}
          orderCount={orders.length}
          addressCount={user.addresses.length}
          favoriteCount={favoriteCount}
        />

        {/* ── Özet Kartlar ─────────────────────────────── */}
        {allSiteOrders.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[#E8E4DE] p-4 text-center">
              <p className="font-sans text-[8px] tracking-[0.3em] uppercase text-[#9A9A9A] mb-1.5">Toplam Alışveriş</p>
              <p className="font-serif text-lg text-[#1A1A1A]">{totalOriginal.toLocaleString("tr-TR")} ₺</p>
            </div>
            <div className="bg-white border border-[#E8E4DE] p-4 text-center">
              <p className="font-sans text-[8px] tracking-[0.3em] uppercase text-[#9A9A9A] mb-1.5">Kazandığın İndirim</p>
              <p className="font-serif text-lg text-[#C4A882]">
                {totalDiscount > 0 ? `${totalDiscount.toLocaleString("tr-TR")} ₺` : "—"}
              </p>
            </div>
            <div className="bg-white border border-[#E8E4DE] p-4 text-center">
              <p className="font-sans text-[8px] tracking-[0.3em] uppercase text-[#9A9A9A] mb-1.5">Toplam Ödediğin</p>
              <p className="font-serif text-lg text-[#1A1A1A] font-medium">{totalPaid.toLocaleString("tr-TR")} ₺</p>
            </div>
          </div>
        )}

        {/* ── Borçlar ───────────────────────────────────── */}
        {debts.length > 0 && (
          <div className="bg-white border border-red-200 p-5">
            <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-red-500 mb-4">Bakiye / Borç</h2>
            <div className="space-y-3">
              {debts.map((debt) => {
                const remaining = debt.totalAmount - debt.paidAmount;
                return (
                  <div key={debt.id} className="border border-[#E8E4DE] p-3 text-xs font-sans">
                    <p className="text-[#1A1A1A] font-medium mb-0.5">{debt.description}</p>
                    {debt.dueDate && (
                      <p className="text-[#9A9A9A] mb-0.5">Vade: {new Date(debt.dueDate).toLocaleDateString("tr-TR")}</p>
                    )}
                    <p className="text-red-600 font-semibold mt-1">Kalan: {remaining.toLocaleString("tr-TR")} ₺</p>
                    {debt.paidAmount > 0 && (
                      <p className="text-green-600 text-[10px]">Ödendi: {debt.paidAmount.toLocaleString("tr-TR")} ₺</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Kayıtlı Favori Listeler ────────────────────── */}
        {favoriteLists.length > 0 && (
          <div className="bg-white border border-[#E8E4DE] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882]">Favori Listelerim</h2>
              <Link href="/hesabim/favorilerim"
                className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#6B6B6B] hover:text-[#C4A882] transition-colors">
                Tümünü Gör →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favoriteLists.map((list) => (
                <Link key={list.id} href="/hesabim/favorilerim"
                  className="flex items-center gap-3 border border-[#E8E4DE] p-3 hover:border-[#C4A882] transition-colors group">
                  {/* Ürün önizlemeleri */}
                  <div className="flex gap-1 shrink-0">
                    {list.productIds.slice(0, 3).map((pid) => {
                      const p = previewMap.get(pid);
                      return p && p.images[0] ? (
                        <div key={pid} className="relative w-10 h-10 bg-[#F7F4F0] overflow-hidden">
                          <Image src={p.images[0]} alt={p.name} fill className="object-contain p-0.5" />
                        </div>
                      ) : (
                        <div key={pid} className="w-10 h-10 bg-[#F7F4F0] flex items-center justify-center">
                          <span className="text-[#C4A882] text-xs opacity-50">◈</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans text-sm text-[#1A1A1A] group-hover:text-[#C4A882] transition-colors">{list.name}</p>
                    <p className="font-sans text-[10px] text-[#9A9A9A]">{list.productIds.length} ürün</p>
                  </div>
                  <span className="ml-auto text-[#9A9A9A] group-hover:text-[#C4A882] transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Ana Grid: Profil & Adresler | Siparişler ─── */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Sol: Adresler */}
          <div className="md:col-span-1 space-y-4">
            <div id="adresler" className="bg-white border border-[#E8E4DE] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882]">Adreslerim</h2>
                <a href="/hesabim/adres-ekle"
                  className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border border-[#E8E4DE] px-2 py-1 transition-colors">
                  + Ekle
                </a>
              </div>
              {user.addresses.length === 0 && !customer?.address ? (
                <p className="font-sans text-xs text-[#9A9A9A]">Henüz adres eklenmemiş.</p>
              ) : (
                <div className="space-y-3">
                  {/* Admin tarafından kaydedilen adres */}
                  {customer?.address && (
                    <div className="border border-[#E8E4DE] p-3 text-xs font-sans bg-[#FAFAF7]">
                      <p className="font-semibold text-[#1A1A1A] mb-0.5">{customer.name}</p>
                      {customer.city && <p className="text-[#6B6B6B]">{customer.city}</p>}
                      <p className="text-[#6B6B6B]">{customer.address}</p>
                      <span className="inline-block mt-1 font-sans text-[8px] tracking-widest uppercase bg-[#EDE5D8] text-[#C4A882] px-1.5 py-0.5">Kayıtlı Adres</span>
                      <AdminAddressActions currentAddress={customer.address} city={customer.city} />
                    </div>
                  )}
                  {(user.addresses as UserAddress[]).map((addr) => (
                    <div key={addr.id} className="border border-[#E8E4DE] p-3 text-xs font-sans">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#1A1A1A]">{addr.recipientName}</p>
                          <p className="text-[#6B6B6B] mt-0.5">{addr.phone}</p>
                          <p className="text-[#6B6B6B] mt-0.5">{addr.addressLine}</p>
                          <p className="text-[#6B6B6B]">{addr.district ? `${addr.district}, ` : ""}{addr.city}</p>
                        </div>
                        {addr.isDefault && (
                          <span className="font-sans text-[8px] tracking-widest uppercase bg-[#EDE5D8] text-[#C4A882] px-1.5 py-0.5 shrink-0">Varsayılan</span>
                        )}
                      </div>
                      <AddressActions id={addr.id} isDefault={addr.isDefault} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sağ: Siparişler */}
          <div id="siparisler" className="md:col-span-2">
            <HesabimSiparisler orders={orders} userPhone={user.phone} />
          </div>
        </div>

      </div>
    </div>
  );
}
