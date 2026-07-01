import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { phoneLookupVariants } from "@/lib/phone";
import { BayiEkleButton, RemoveBayiButton, BackfillButton } from "@/components/admin/BayilerClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bayi Yönetimi — Ormivo Admin" };

const SEGMENT_BADGE: Record<string, string> = {
  DIAMOND: "bg-cyan-600 text-white",
  GOLD:    "bg-yellow-500 text-white",
  SILVER:  "bg-gray-400 text-white",
  BRONZE:  "bg-orange-600 text-white",
};
const SEGMENT_LABEL: Record<string, string> = {
  DIAMOND: "Diamond", GOLD: "Gold", SILVER: "Silver", BRONZE: "Bronze",
};

export default async function BayilerPage() {
  // 1) SiteUser: B2B onaylı veya Diamond
  const siteUsers = await prisma.siteUser.findMany({
    where: { OR: [{ isB2BApproved: true }, { segment: "DIAMOND" }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, phone: true, email: true,
      isB2B: true, isB2BApproved: true, b2bNote: true,
      referralCode: true, b2bMarkup: true, segment: true,
      createdAt: true,
      _count: { select: { siteOrders: true, referrals: true } },
    },
  });

  // 2) Customer: Diamond ama SiteUser listesinde yok (eşleşmemiş)
  const diamondCustomers = await prisma.customer.findMany({
    where: { segment: "DIAMOND" },
    select: { id: true, name: true, phone: true, email: true, segment: true, createdAt: true, _count: { select: { orders: true } } },
  });

  // SiteUser phone set
  const siteUserPhones = new Set(siteUsers.map((u) => u.phone));

  // Diamond customers that have NO matching SiteUser
  const unmatchedDiamond = diamondCustomers.filter((c) => {
    if (!c.phone) return true;
    return !phoneLookupVariants(c.phone).some((v) => siteUserPhones.has(v));
  });

  // Aggregate total spend per SiteUser
  const orderTotals = await prisma.siteOrder.groupBy({
    by: ["userId"],
    where: { userId: { in: siteUsers.map((u) => u.id) } },
    _sum: { total: true },
  });
  const totalMap = new Map(orderTotals.map((r) => [r.userId, Number(r._sum.total ?? 0)]));

  const dealers = siteUsers.map((u) => ({
    ...u,
    b2bMarkup: u.b2bMarkup != null ? Number(u.b2bMarkup) : null,
    totalSpend: totalMap.get(u.id) ?? 0,
  }));

  const approved = dealers.filter((d) => d.isB2BApproved);
  const diamondOnly = dealers.filter((d) => !d.isB2BApproved && d.segment === "DIAMOND");

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Bayi Yönetimi</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">
            {approved.length} onaylı bayi · {diamondOnly.length + unmatchedDiamond.length} diamond üye
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BackfillButton />
          <BayiEkleButton />
        </div>
      </div>

      {/* Onaylı Bayiler */}
      <section className="mb-10">
        <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">Onaylı Bayiler ({approved.length})</h3>
        {approved.length === 0 ? (
          <div className="bg-white border border-[#e8ddd6] rounded-sm py-8 text-center text-sm text-[#b8a89e]">Henüz onaylı bayi yok.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {approved.map((u) => (
              <div key={u.id} className="relative group">
                <DealerCard user={u} />
                <RemoveBayiButton userId={u.id} name={u.name} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Diamond Üyeler (web hesabı var) */}
      {diamondOnly.length > 0 && (
        <section className="mb-10">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">Diamond Üyeler — Bayi Değil ({diamondOnly.length})</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {diamondOnly.map((u) => (
              <div key={u.id} className="relative group">
                <DealerCard user={u} />
                <RemoveBayiButton userId={u.id} name={u.name} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Diamond Müşteriler (web hesabı YOK) */}
      {unmatchedDiamond.length > 0 && (
        <section>
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-1">Diamond Müşteriler — Web Hesabı Yok ({unmatchedDiamond.length})</h3>
          <p className="text-xs text-[#b8a89e] mb-4">Bu müşteriler web sitesine kayıt olmadığı için bayi sistemi uygulanamaz. Aynı telefonla siteye kayıt olduklarında otomatik aktifleşir.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {unmatchedDiamond.map((c) => (
              <div key={c.id} className="bg-white border border-dashed border-[#d4c5ba] rounded-sm p-5 opacity-70">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-[#2c1810]">{c.name}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-cyan-600 text-white">Diamond</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Web Hesabı Yok</span>
                    </div>
                    <p className="text-sm text-[#8b6f5e]">{c.phone ?? "—"}</p>
                    {c.email && <p className="text-xs text-[#b8a89e]">{c.email}</p>}
                  </div>
                </div>
                <div className="text-center border-t border-[#f0e8e0] pt-2 mt-1">
                  <p className="text-[10px] text-[#b8a89e]">{c._count.orders} admin siparişi</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DealerCard({ user }: {
  user: {
    id: string; name: string | null; phone: string; email: string | null;
    isB2BApproved: boolean; b2bMarkup: number | null; segment: string | null;
    referralCode: string | null; totalSpend: number; createdAt: Date;
    _count: { siteOrders: number; referrals: number };
  };
}) {
  return (
    <Link
      href={`/admin/bayiler/${user.id}`}
      className="block bg-white border border-[#e8ddd6] rounded-sm p-5 hover:border-[#8b6f5e] hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-medium text-[#2c1810] truncate">{user.name ?? "—"}</p>
            {user.segment && SEGMENT_BADGE[user.segment] && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wide ${SEGMENT_BADGE[user.segment]}`}>
                {SEGMENT_LABEL[user.segment]}
              </span>
            )}
            {user.isB2BApproved && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-[#2c1810] text-[#c4a882] tracking-wide">Bayi</span>
            )}
          </div>
          <p className="text-sm text-[#8b6f5e]">{user.phone}</p>
        </div>
        <span className="text-[#c4a882] text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0">→</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center border-t border-[#f0e8e0] pt-3">
        <div>
          <p className="text-[10px] text-[#b8a89e] uppercase tracking-wide">Sipariş</p>
          <p className="text-sm font-semibold text-[#2c1810]">{user._count.siteOrders}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#b8a89e] uppercase tracking-wide">Toplam</p>
          <p className="text-sm font-semibold text-[#2c1810]">{user.totalSpend.toLocaleString("tr-TR")} ₺</p>
        </div>
        <div>
          <p className="text-[10px] text-[#b8a89e] uppercase tracking-wide">Markup</p>
          <p className="text-sm font-semibold text-[#2c1810]">
            {user.b2bMarkup != null ? `+${user.b2bMarkup.toLocaleString("tr-TR")} ₺` : "—"}
          </p>
        </div>
      </div>
      {user.referralCode && (
        <div className="mt-2 pt-2 border-t border-[#f0e8e0] flex items-center justify-between">
          <span className="text-[10px] text-[#b8a89e]">Ref: <span className="font-mono font-bold text-[#8b6f5e]">{user.referralCode}</span></span>
          <span className="text-[10px] text-[#b8a89e]">{user._count.referrals} kişi</span>
        </div>
      )}
    </Link>
  );
}
