import { redirect }          from "next/navigation";
import { getSession }         from "@/lib/session";
import { prisma }             from "@/lib/prisma";
import Image                  from "next/image";
import Link                   from "next/link";
import AddressActions         from "./AddressActions";
import HesabimProfileForm     from "./HesabimProfileForm";
import HesabimSiparisler      from "./HesabimSiparisler";
import FavoriteButton         from "@/components/site/FavoriteButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hesabım — Ormivo" };

interface UserAddress {
  id: string; recipientName: string; phone: string;
  addressLine: string; city: string; district: string | null; isDefault: boolean;
}

export default async function HesabimPage() {
  const session = await getSession();
  if (!session) redirect("/giris");

  const [user, orders, favorites] = await Promise.all([
    prisma.siteUser.findUnique({
      where:   { id: session.userId },
      include: { addresses: { orderBy: { isDefault: "desc" } } },
    }),
    prisma.siteOrder.findMany({
      where:   { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take:    20,
      select: {
        id: true, orderNo: true, createdAt: true, status: true,
        items: true, total: true, discount: true,
        trackingNo: true, cargoCompany: true,
      },
    }),
    prisma.favorite.findMany({
      where:   { userId: session.userId },
      include: { product: { include: { brand: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) redirect("/giris");

  // Borçları müşteri telefon eşleşmesiyle bul
  const customer = await prisma.customer.findFirst({
    where: { phone: user.phone },
    include: {
      debts: {
        where: { status: { not: "ODENDI" } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  const debts = customer?.debts ?? [];

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-[#1A1A1A] mb-1">Hesabım</h1>
          <p className="font-sans text-sm text-[#9A9A9A]">{user.phone}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Sol: Profil & Adresler */}
          <div className="md:col-span-1 space-y-4">
            {/* Profil düzenleme */}
            <HesabimProfileForm currentName={user.name ?? ""} phone={user.phone} />

            {/* Borçlar */}
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
                          <p className="text-[#9A9A9A] mb-0.5">
                            Vade: {new Date(debt.dueDate).toLocaleDateString("tr-TR")}
                          </p>
                        )}
                        <p className="text-red-600 font-semibold mt-1">
                          Kalan: {remaining.toLocaleString("tr-TR")} ₺
                        </p>
                        {debt.paidAmount > 0 && (
                          <p className="text-green-600 text-[10px]">
                            Ödendi: {debt.paidAmount.toLocaleString("tr-TR")} ₺
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white border border-[#E8E4DE] p-5">
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
          <div className="md:col-span-2">
            <HesabimSiparisler orders={orders} userPhone={user.phone} />
          </div>
        </div>

        {/* Favoriler */}
        {favorites.length > 0 && (
          <div id="favoriler" className="mt-8">
            <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882] mb-5">Favorilerim</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {favorites.map(({ product }) => {
                const price   = Number(product.price);
                const compare = product.comparePrice ? Number(product.comparePrice) : null;
                const img     = product.images?.[0] ?? null;
                return (
                  <article key={product.id} className="group bg-white border border-[#E8E4DE] hover:border-[#C4A882] hover:shadow-sm transition-all duration-200 flex flex-col">
                    <div className="relative overflow-hidden bg-[#F7F4F0]" style={{ aspectRatio: "3/4" }}>
                      <Link href={`/urunler/${product.slug}`} className="absolute inset-0" aria-label={product.name} />
                      {img ? (
                        <Image src={img} alt={product.name} fill
                          sizes="(max-width:640px) 50vw, 20vw"
                          className="object-contain p-3 group-hover:scale-[1.03] transition-transform duration-300 pointer-events-none" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center font-serif text-3xl text-[#C4A882] opacity-20 pointer-events-none">◈</span>
                      )}
                      <FavoriteButton productId={product.id} loggedIn={true} initialFavorited={true} />
                    </div>
                    <div className="p-2 flex flex-col flex-1">
                      {product.brand?.name && (
                        <p className="font-sans text-[7px] tracking-[0.2em] text-[#C4A882] mb-0.5">{product.brand.name.toLocaleUpperCase("tr-TR")}</p>
                      )}
                      <Link href={`/urunler/${product.slug}`}>
                        <h3 className="font-sans text-[11px] leading-snug text-[#1A1A1A] hover:text-[#C4A882] transition-colors line-clamp-2 mb-1">{product.name}</h3>
                      </Link>
                      <p className="font-sans text-xs font-semibold text-[#1A1A1A] mt-auto">
                        {price.toLocaleString("tr-TR")} ₺
                        {compare && <span className="ml-1.5 text-[10px] font-normal text-[#C4A882] line-through">{compare.toLocaleString("tr-TR")} ₺</span>}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
