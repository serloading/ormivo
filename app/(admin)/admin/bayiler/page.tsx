import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BayiEkleButton, RemoveBayiButton } from "@/components/admin/BayilerClient";
import { phoneLookupVariants } from "@/lib/phone";

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
const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede", CONFIRMED: "Onaylandı", SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi", CANCELLED: "İptal Edildi",
};
const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", CONFIRMED: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-blue-100 text-blue-700", DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
const pct = (curr: number, prev: number) => {
  if (prev === 0) return curr > 0 ? "+∞%" : "—";
  const d = ((curr - prev) / prev) * 100;
  return (d >= 0 ? "+" : "") + d.toFixed(0) + "%";
};
const pctCls = (curr: number, prev: number) =>
  prev === 0 || curr >= prev ? "text-green-600" : "text-red-500";

export default async function BayilerPage() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = thisMonthStart;

  // ── Bayiler ───────────────────────────────────────────────
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
  const dealerIds = siteUsers.map((u) => u.id);

  // ── Bayi telefonu → eşleşen Customer.id eşleştirmesi ──────
  // Bayilerin bir kısmının siparişleri admin panelinden manuel girilen
  // Order kayıtları (Customer üzerinden), SiteOrder değil. İkisini de
  // dahil etmek için telefon üzerinden Customer'ı buluyoruz.
  const allPhoneVariants = [...new Set(siteUsers.flatMap((u) => phoneLookupVariants(u.phone)))];
  const matchingCustomers = allPhoneVariants.length
    ? await prisma.customer.findMany({
        where: { phone: { in: allPhoneVariants } },
        select: { id: true, phone: true },
      })
    : [];
  // customerId → dealer siteUserId
  const customerIdToDealerId = new Map<string, string>();
  for (const u of siteUsers) {
    const variants = new Set(phoneLookupVariants(u.phone));
    for (const c of matchingCustomers) {
      if (c.phone && variants.has(c.phone)) customerIdToDealerId.set(c.id, u.id);
    }
  }
  const customerIds = [...customerIdToDealerId.keys()];

  // ── Tüm zamanlar toplam (SiteOrder + manuel Order) ────────
  const [siteAllTime, manualAllTime] = await Promise.all([
    prisma.siteOrder.groupBy({ by: ["userId"], where: { userId: { in: dealerIds } }, _sum: { total: true } }),
    customerIds.length
      ? prisma.order.groupBy({ by: ["customerId"], where: { customerId: { in: customerIds }, status: { not: "CANCELLED" } }, _sum: { total: true } })
      : Promise.resolve([]),
  ]);
  const allTimeMap = new Map<string, number>();
  for (const r of siteAllTime) allTimeMap.set(r.userId!, Number(r._sum.total ?? 0));
  for (const r of manualAllTime) {
    const dealerId = customerIdToDealerId.get(r.customerId!);
    if (!dealerId) continue;
    allTimeMap.set(dealerId, (allTimeMap.get(dealerId) ?? 0) + Number(r._sum.total ?? 0));
  }

  // ── Bu ay (SiteOrder + manuel Order) ──────────────────────
  const [siteThisMonth, manualThisMonth] = await Promise.all([
    prisma.siteOrder.groupBy({ by: ["userId"], where: { userId: { in: dealerIds }, createdAt: { gte: thisMonthStart } }, _sum: { total: true }, _count: true }),
    customerIds.length
      ? prisma.order.groupBy({ by: ["customerId"], where: { customerId: { in: customerIds }, status: { not: "CANCELLED" }, createdAt: { gte: thisMonthStart } }, _sum: { total: true }, _count: true })
      : Promise.resolve([]),
  ]);
  const thisMonthMap = new Map<string, { rev: number; cnt: number }>();
  for (const r of siteThisMonth) thisMonthMap.set(r.userId!, { rev: Number(r._sum.total ?? 0), cnt: r._count });
  for (const r of manualThisMonth) {
    const dealerId = customerIdToDealerId.get(r.customerId!);
    if (!dealerId) continue;
    const prev = thisMonthMap.get(dealerId) ?? { rev: 0, cnt: 0 };
    thisMonthMap.set(dealerId, { rev: prev.rev + Number(r._sum.total ?? 0), cnt: prev.cnt + r._count });
  }

  // ── Geçen ay (SiteOrder + manuel Order) ───────────────────
  const [siteLastMonth, manualLastMonth] = await Promise.all([
    prisma.siteOrder.groupBy({ by: ["userId"], where: { userId: { in: dealerIds }, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } }, _sum: { total: true }, _count: true }),
    customerIds.length
      ? prisma.order.groupBy({ by: ["customerId"], where: { customerId: { in: customerIds }, status: { not: "CANCELLED" }, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } }, _sum: { total: true }, _count: true })
      : Promise.resolve([]),
  ]);
  const lastMonthMap = new Map<string, { rev: number; cnt: number }>();
  for (const r of siteLastMonth) lastMonthMap.set(r.userId!, { rev: Number(r._sum.total ?? 0), cnt: r._count });
  for (const r of manualLastMonth) {
    const dealerId = customerIdToDealerId.get(r.customerId!);
    if (!dealerId) continue;
    const prev = lastMonthMap.get(dealerId) ?? { rev: 0, cnt: 0 };
    lastMonthMap.set(dealerId, { rev: prev.rev + Number(r._sum.total ?? 0), cnt: prev.cnt + r._count });
  }

  // ── Tüm zamanlar sipariş sayısı (kart üzerindeki "Sipariş" alanı) ──
  const manualOrderCounts = customerIds.length
    ? await prisma.order.groupBy({ by: ["customerId"], where: { customerId: { in: customerIds }, status: { not: "CANCELLED" } }, _count: true })
    : [];
  const manualOrderCountMap = new Map<string, number>();
  for (const r of manualOrderCounts) {
    const dealerId = customerIdToDealerId.get(r.customerId!);
    if (!dealerId) continue;
    manualOrderCountMap.set(dealerId, (manualOrderCountMap.get(dealerId) ?? 0) + r._count);
  }

  // ── Referral sayısı (bu bayi kodu ile kaydolan) ───────────
  const refRows = await prisma.siteUser.groupBy({
    by: ["referredById"],
    where: { referredById: { in: dealerIds } },
    _count: true,
  });
  const refMap = new Map(refRows.map((r) => [r.referredById as string, r._count]));

  // ── Ödenmemiş borç toplamı (CustomerDebt, telefon eşleşmesi üzerinden) ──
  const debtRows = customerIds.length
    ? await prisma.customerDebt.groupBy({
        by: ["customerId"],
        where: { customerId: { in: customerIds }, status: { not: "ODENDI" } },
        _sum: { totalAmount: true, paidAmount: true },
      })
    : [];
  const debtMap = new Map<string, number>();
  for (const r of debtRows) {
    const dealerId = customerIdToDealerId.get(r.customerId);
    if (!dealerId) continue;
    const remaining = Number(r._sum.totalAmount ?? 0) - Number(r._sum.paidAmount ?? 0);
    debtMap.set(dealerId, (debtMap.get(dealerId) ?? 0) + remaining);
  }

  // ── Birleştir ─────────────────────────────────────────────
  const dealers = siteUsers.map((u) => ({
    ...u,
    b2bMarkup:   u.b2bMarkup != null ? Number(u.b2bMarkup) : null,
    totalSpend:  allTimeMap.get(u.id) ?? 0,
    orderCount:  u._count.siteOrders + (manualOrderCountMap.get(u.id) ?? 0),
    thisRev:     thisMonthMap.get(u.id)?.rev ?? 0,
    thisCnt:     thisMonthMap.get(u.id)?.cnt ?? 0,
    lastRev:     lastMonthMap.get(u.id)?.rev ?? 0,
    lastCnt:     lastMonthMap.get(u.id)?.cnt ?? 0,
    refCount:    refMap.get(u.id) ?? 0,
    debtAmount:  Math.max(0, debtMap.get(u.id) ?? 0),
  }));

  // ── Son siparişler (SiteOrder + manuel Order karışık, tarihe göre) ──
  const [siteRecentOrders, manualRecentOrders] = await Promise.all([
    prisma.siteOrder.findMany({
      where: { userId: { in: dealerIds } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, orderNo: true, total: true, createdAt: true, status: true, userId: true },
    }),
    customerIds.length
      ? prisma.order.findMany({
          where: { customerId: { in: customerIds } },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, orderNo: true, total: true, createdAt: true, status: true, customerId: true },
        })
      : Promise.resolve([]),
  ]);
  const dealerNameById = new Map(siteUsers.map((u) => [u.id, u.name ?? u.phone]));
  const recentOrders = [
    ...siteRecentOrders.map((o) => ({
      id: o.id, orderNo: o.orderNo, total: Number(o.total), createdAt: o.createdAt, status: o.status,
      dealerId: o.userId as string, dealerName: dealerNameById.get(o.userId as string) ?? "—",
    })),
    ...manualRecentOrders
      .map((o) => {
        const dealerId = customerIdToDealerId.get(o.customerId as string);
        if (!dealerId) return null;
        return { id: o.id, orderNo: o.orderNo, total: Number(o.total), createdAt: o.createdAt, status: o.status, dealerId, dealerName: dealerNameById.get(dealerId) ?? "—" };
      })
      .filter((o): o is NonNullable<typeof o> => o !== null),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 15);

  // ── Özet istatistikler ────────────────────────────────────
  const totalThisRev  = dealers.reduce((s, d) => s + d.thisRev, 0);
  const totalLastRev  = dealers.reduce((s, d) => s + d.lastRev, 0);
  const totalThisCnt  = dealers.reduce((s, d) => s + d.thisCnt, 0);
  const totalLastCnt  = dealers.reduce((s, d) => s + d.lastCnt, 0);
  const avgThis = totalThisCnt > 0 ? totalThisRev / totalThisCnt : 0;
  const avgLast = totalLastCnt > 0 ? totalLastRev / totalLastCnt : 0;

  // ── Sıralama (bu ay cirosuna göre) ───────────────────────
  const ranked = [...dealers].sort((a, b) => b.thisRev - a.thisRev);

  // ── Max bar genişliği ─────────────────────────────────────
  const maxRev = ranked[0]?.thisRev ?? 1;

  const MONTH_TR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  const thisMonthLabel = MONTH_TR[now.getMonth()];
  const lastMonthLabel = MONTH_TR[(now.getMonth() + 11) % 12];

  return (
    <div>
      {/* ── Başlık ── */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Bayi Yönetimi</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">{dealers.length} bayi</p>
        </div>
        <BayiEkleButton />
      </div>

      {/* ════════════════════════════════════════
          RAPORLAMA
      ════════════════════════════════════════ */}
      <div className="mb-10 space-y-6">

        {/* Özet kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: `${thisMonthLabel} Cirosu`,
              value: `${fmt(totalThisRev)} ₺`,
              sub: `${lastMonthLabel}: ${fmt(totalLastRev)} ₺`,
              badge: pct(totalThisRev, totalLastRev),
              badgeCls: pctCls(totalThisRev, totalLastRev),
            },
            {
              label: `${thisMonthLabel} Sipariş`,
              value: String(totalThisCnt),
              sub: `${lastMonthLabel}: ${totalLastCnt} sipariş`,
              badge: pct(totalThisCnt, totalLastCnt),
              badgeCls: pctCls(totalThisCnt, totalLastCnt),
            },
            {
              label: "Ort. Sepet",
              value: `${fmt(avgThis)} ₺`,
              sub: `${lastMonthLabel}: ${fmt(avgLast)} ₺`,
              badge: pct(avgThis, avgLast),
              badgeCls: pctCls(avgThis, avgLast),
            },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#e8ddd6] rounded-sm p-5">
              <p className="text-[11px] uppercase tracking-widest text-[#b8a89e] mb-2">{s.label}</p>
              <div className="flex items-end justify-between gap-2">
                <p className="text-2xl font-light text-[#2c1810]">{s.value}</p>
                <span className={`text-xs font-semibold ${s.badgeCls}`}>{s.badge}</span>
              </div>
              <p className="text-[11px] text-[#b8a89e] mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Aylık sıralama */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f0e8e0] flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-widest text-[#5c4033]">{thisMonthLabel} — Bayi Sıralaması</h3>
            <span className="text-[10px] text-[#b8a89e]">ciro bazlı</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0ebe6] bg-[#faf7f4] text-left">
                {["#", "Bayi", "Bu Ay Ciro", "Sipariş", "Ort. Sepet", "Geçen Ay", "Değişim", "Referral"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#b8a89e] font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f2ef]">
              {ranked.map((d, i) => {
                const barW = maxRev > 0 ? Math.round((d.thisRev / maxRev) * 100) : 0;
                const avgD = d.thisCnt > 0 ? d.thisRev / d.thisCnt : 0;
                return (
                  <tr key={d.id} className="hover:bg-[#fdf9f7]">
                    <td className="px-4 py-3 text-[#b8a89e] font-light w-8">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-xs">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/bayiler/${d.id}`} className="hover:text-[#8b6f5e] transition-colors">
                        <p className="font-medium text-[#2c1810] text-sm">{d.name ?? "—"}</p>
                        <p className="text-[10px] text-[#b8a89e]">{d.phone}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <p className="font-semibold text-[#2c1810] whitespace-nowrap">{fmt(d.thisRev)} ₺</p>
                      <div className="mt-1 h-1 bg-[#f0e8e0] rounded-full w-32">
                        <div className="h-1 bg-[#8b6f5e] rounded-full" style={{ width: `${barW}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#5c4033] whitespace-nowrap">{d.thisCnt}</td>
                    <td className="px-4 py-3 text-[#5c4033] whitespace-nowrap">{d.thisCnt > 0 ? `${fmt(avgD)} ₺` : "—"}</td>
                    <td className="px-4 py-3 text-[#b8a89e] whitespace-nowrap">{fmt(d.lastRev)} ₺</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold ${pctCls(d.thisRev, d.lastRev)}`}>
                        {pct(d.thisRev, d.lastRev)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5c4033] whitespace-nowrap">
                      {d.refCount > 0 ? (
                        <span className="text-xs bg-[#f0e8e0] text-[#8b6f5e] px-2 py-0.5 rounded-full font-medium">
                          +{d.refCount} kişi
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
              {ranked.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[#b8a89e]">Bu ay sipariş yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Son siparişler */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f0e8e0] flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-widest text-[#5c4033]">Bayilerin Son Siparişleri</h3>
            <span className="text-[10px] text-[#b8a89e]">tüm bayiler</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0ebe6] bg-[#faf7f4] text-left">
                {["Bayi", "Sipariş No", "Tarih", "Tutar", "Durum"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[10px] uppercase tracking-wide text-[#b8a89e] font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f2ef]">
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-[#fdf9f7]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/bayiler/${o.dealerId}`} className="font-medium text-[#2c1810] text-sm hover:text-[#8b6f5e] transition-colors">
                      {o.dealerName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#5c4033] whitespace-nowrap">#{o.orderNo}</td>
                  <td className="px-4 py-3 text-[#8b6f5e] whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#2c1810] whitespace-nowrap">{fmt(o.total)} ₺</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLOR[o.status] ?? "bg-[#f0e8e0] text-[#8b6f5e]"}`}>
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#b8a89e]">Henüz sipariş yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bayi kartları ── */}
      {dealers.length === 0 ? (
        <div className="bg-white border border-[#e8ddd6] rounded-sm py-8 text-center text-sm text-[#b8a89e]">Henüz bayi yok.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {dealers.map((u) => (
            <div key={u.id} className="relative group">
              <DealerCard user={u} />
              <RemoveBayiButton userId={u.id} name={u.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DealerCard({ user }: {
  user: {
    id: string; name: string | null; phone: string; email: string | null;
    isB2BApproved: boolean; b2bMarkup: number | null; segment: string | null;
    referralCode: string | null; totalSpend: number; orderCount: number; debtAmount: number; createdAt: Date;
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
          <p className="text-sm font-semibold text-[#2c1810]">{user.orderCount}</p>
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
      {user.debtAmount > 0 && (
        <div className="mt-2 pt-2 border-t border-[#f0e8e0] flex items-center justify-between">
          <span className="text-[10px] text-red-600 uppercase tracking-wide font-medium">Ödenmemiş Borç</span>
          <span className="text-sm font-semibold text-red-600">{user.debtAmount.toLocaleString("tr-TR")} ₺</span>
        </div>
      )}
      {user.referralCode && (
        <div className="mt-2 pt-2 border-t border-[#f0e8e0] flex items-center justify-between">
          <span className="text-[10px] text-[#b8a89e]">Ref: <span className="font-mono font-bold text-[#8b6f5e]">{user.referralCode}</span></span>
          <span className="text-[10px] text-[#b8a89e]">{user._count.referrals} kişi</span>
        </div>
      )}
    </Link>
  );
}
