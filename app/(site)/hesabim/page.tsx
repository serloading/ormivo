import { redirect }      from "next/navigation";
import { getSession }     from "@/lib/session";
import { prisma }         from "@/lib/prisma";
import Image              from "next/image";
import Link               from "next/link";
import AddressActions     from "./AddressActions";
import HesabimProfileForm from "./HesabimProfileForm";
import HesabimSiparisler  from "./HesabimSiparisler";
import { SEGMENT_LABELS, SEGMENT_COLORS } from "@/lib/segment";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hesabım — Ormivo" };

const SEGMENT_ICONS: Record<string, string> = {
  BRONZE: "🥉",
  SILVER: "🥈",
  GOLD:   "🏅",
};

interface UserAddress {
  id: string; recipientName: string; phone: string;
  addressLine: string; city: string; district: string | null; isDefault: boolean;
}

export default async function HesabimPage() {
  const session = await getSession();
  if (!session) redirect("/giris");

  const [user, orders, allOrders, favoriteLists, favoriteCount] = await Promise.all([
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

  type OrderItem = { qty?: number; quantity?: number; price: number };
  const totalOriginal = allOrders.reduce((sum, o) => {
    const items = o.items as OrderItem[];
    return sum + items.reduce((s, i) => s + (i.qty ?? i.quantity ?? 1) * i.price, 0);
  }, 0);
  const totalPaid     = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalDiscount = Math.max(0, totalOriginal - totalPaid);

  const customer = await prisma.customer.findFirst({
    where: { phone: user.phone },
    include: {
      debts: { where: { status: { not: "ODENDI" } }, orderBy: { createdAt: "desc" } },
    },
  });
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

        {/* ── Profil Başlığı ─────────────────────────── */}
        <div className="bg-white border border-[#E8E4DE] p-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-[#EDE5D8] flex items-center justify-center shrink-0">
              <span className="font-serif text-xl text-[#C4A882]">{initials}</span>
            </div>

            {/* İsim + Rozet + Telefon */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-xl text-[#1A1A1A] leading-tight">
                  {user.name || "Üye"}
                </h1>
                {session.segment && SEGMENT_LABELS[session.segment] && (
                  <span className={`inline-flex items-center gap-1 font-sans text-[10px] px-2 py-0.5 rounded font-semibold ${SEGMENT_COLORS[session.segment]}`}>
                    <span>{SEGMENT_ICONS[session.segment] ?? "◆"}</span>
                    {SEGMENT_LABELS[session.segment]}
                  </span>
                )}
              </div>
              <p className="font-sans text-sm text-[#9A9A9A] mt-0.5">{user.phone}</p>
            </div>

            {/* Hızlı edit */}
            <Link href="#profil"
              className="hidden md:block font-sans text-[9px] tracking-[0.15em] uppercase border border-[#E8E4DE] px-3 py-1.5 text-[#6B6B6B] hover:border-[#C4A882] hover:text-[#C4A882] transition-colors shrink-0">
              Profil Düzenle
            </Link>
          </div>

          {/* Hızlı navigasyon */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#E8E4DE]">
            <a href="#siparisler" className="flex flex-col items-center gap-1.5 group">
              <span className="text-xl">📦</span>
              <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] group-hover:text-[#1A1A1A] transition-colors text-center">Siparişlerim</span>
              <span className="font-sans text-sm font-medium text-[#1A1A1A]">{allOrders.length}</span>
            </a>
            <a href="#adresler" className="flex flex-col items-center gap-1.5 group">
              <span className="text-xl">📍</span>
              <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] group-hover:text-[#1A1A1A] transition-colors text-center">Adreslerim</span>
              <span className="font-sans text-sm font-medium text-[#1A1A1A]">{user.addresses.length}</span>
            </a>
            <Link href="/hesabim/favorilerim" className="flex flex-col items-center gap-1.5 group">
              <span className="text-xl">♡</span>
              <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] group-hover:text-[#1A1A1A] transition-colors text-center">Favorilerim</span>
              <span className="font-sans text-sm font-medium text-[#1A1A1A]">{favoriteCount}</span>
            </Link>
          </div>
        </div>

        {/* ── Özet Kartlar ─────────────────────────────── */}
        {allOrders.length > 0 && (
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

          {/* Sol: Profil + Adresler */}
          <div className="md:col-span-1 space-y-4">
            <div id="profil">
              <HesabimProfileForm currentName={user.name ?? ""} phone={user.phone} />
            </div>

            <div id="adresler" className="bg-white border border-[#E8E4DE] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882]">Adreslerim</h2>
                <a href="/hesabim/adres-ekle"
                  className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border border-[#E8E4DE] px-2 py-1 transition-colors">
                  + Ekle
                </a>
              </div>
              {user.addresses.length === 0 ? (
                <p className="font-sans text-xs text-[#9A9A9A]">Henüz adres eklenmemiş.</p>
              ) : (
                <div className="space-y-3">
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
