import { redirect }     from "next/navigation";
import Link              from "next/link";
import { getSession }    from "@/lib/session";
import { prisma }        from "@/lib/prisma";
import AddressActions    from "./AddressActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hesabım — Ormivo" };

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Hazırlanıyor",
  CONFIRMED: "Onaylandı",
  SHIPPED:   "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};

export default async function HesabimPage() {
  const session = await getSession();
  if (!session) redirect("/giris");

  const [user, orders] = await Promise.all([
    prisma.siteUser.findUnique({
      where:   { id: session.userId },
      include: { addresses: { orderBy: { isDefault: "desc" } } },
    }),
    prisma.siteOrder.findMany({
      where:   { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),
  ]);

  if (!user) redirect("/giris");

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
            <div className="bg-white border border-[#E8E4DE] p-5">
              <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882] mb-4">Profil</h2>
              <p className="font-sans text-sm text-[#1A1A1A] mb-0.5">{user.name ?? "—"}</p>
              <p className="font-sans text-xs text-[#9A9A9A]">{user.phone}</p>
            </div>

            <div className="bg-white border border-[#E8E4DE] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882]">Adreslerim</h2>
                <Link href="/hesabim/adres-ekle"
                  className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border border-[#E8E4DE] px-2 py-1 transition-colors">
                  + Ekle
                </Link>
              </div>
              {user.addresses.length === 0 ? (
                <p className="font-sans text-xs text-[#9A9A9A]">Henüz adres eklenmemiş.</p>
              ) : (
                <div className="space-y-3">
                  {user.addresses.map((addr) => (
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
            <div className="bg-white border border-[#E8E4DE] p-5">
              <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882] mb-5">Siparişlerim</h2>
              {orders.length === 0 ? (
                <p className="font-sans text-sm text-[#9A9A9A] py-8 text-center">Henüz siparişiniz bulunmuyor.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const itemsArr = order.items as { name: string; qty: number; price: number }[];
                    return (
                      <div key={order.id} className="border border-[#E8E4DE] p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-sans text-[10px] text-[#9A9A9A] mb-0.5">
                              {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                            <p className="font-sans text-[10px] tracking-widest text-[#6B6B6B]">#{order.orderNo}</p>
                          </div>
                          <span className={`font-sans text-[9px] tracking-[0.15em] uppercase px-2 py-1 shrink-0 ${
                            order.status === "DELIVERED" ? "bg-green-50 text-green-700" :
                            order.status === "SHIPPED"   ? "bg-blue-50 text-blue-700"   :
                            order.status === "CANCELLED" ? "bg-red-50 text-red-600"     :
                                                           "bg-[#EDE5D8] text-[#C4A882]"
                          }`}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </div>

                        <div className="space-y-1 mb-3">
                          {itemsArr.map((item, idx) => (
                            <p key={idx} className="font-sans text-xs text-[#6B6B6B]">
                              {item.name} ×{item.qty}
                            </p>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#E8E4DE]">
                          <p className="font-sans text-sm font-semibold text-[#1A1A1A]">
                            {Number(order.total).toLocaleString("tr-TR")} ₺
                          </p>
                          {order.trackingNo && (
                            <div className="font-sans text-[10px] text-right">
                              <p className="text-[#9A9A9A] tracking-wide">Kargo Takip</p>
                              <p className="text-[#1A1A1A] font-semibold tracking-widest">{order.trackingNo}</p>
                              {order.cargoCompany && <p className="text-[#9A9A9A]">{order.cargoCompany}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
