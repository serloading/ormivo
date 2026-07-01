"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBayiProfile, revokeB2B, updateB2BMarkup } from "@/lib/actions/b2b";

// ── Types ─────────────────────────────────────────────────────
type User = {
  id: string; name: string | null; phone: string; email: string | null;
  segment: string | null; isB2B: boolean; isB2BApproved: boolean;
  b2bMarkup: number | null; b2bNote: string | null; referralCode: string | null;
  createdAt: Date;
};
type Stats = {
  totalSpend: number; pendingPayment: number; totalDebt: number;
  orderCount: number; referralCount: number;
};
type OrderItem = { productId?: string; name?: string; qty?: number; quantity?: number; price?: number };
type Order = {
  id: string; orderNo: string; status: string; paymentStatus: string;
  total: number; createdAt: Date; recipientName: string | null; city: string | null;
  items: OrderItem[];
};
type Debt = {
  id: string; description: string; totalAmount: number; paidAmount: number;
  status: string; dueDate: Date | null; createdAt: Date; orderNo: string | null;
  payments: { id: string; amount: number; note: string | null; paidAt: Date }[];
};
type Referral = {
  id: string; name: string | null; phone: string; email: string | null;
  segment: string | null; createdAt: Date; orderCount: number;
};
type TopProduct = { name: string; qty: number; total: number };

// ── Constants ─────────────────────────────────────────────────
const SEGMENT_BADGE: Record<string, string> = {
  DIAMOND: "bg-cyan-600 text-white", GOLD: "bg-yellow-500 text-white",
  SILVER: "bg-gray-400 text-white", BRONZE: "bg-orange-600 text-white",
};
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Bekliyor",   cls: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Onaylandı",  cls: "bg-blue-100 text-blue-800" },
  SHIPPED:   { label: "Kargoda",    cls: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Teslim",     cls: "bg-green-100 text-green-800" },
  CANCELLED: { label: "İptal",      cls: "bg-red-100 text-red-800" },
};
const PAY_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Ödenmedi", cls: "bg-red-100 text-red-700" },
  PARTIAL: { label: "Kısmi",    cls: "bg-orange-100 text-orange-700" },
  PAID:    { label: "Ödendi",   cls: "bg-green-100 text-green-700" },
};

// ── Edit Profile Modal ────────────────────────────────────────
function EditProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [segment, setSegment] = useState(user.segment ?? "");
  const [markup, setMarkup] = useState(user.b2bMarkup != null ? String(user.b2bMarkup) : "");
  const [note, setNote] = useState(user.b2bNote ?? "");
  const [refCode, setRefCode] = useState(user.referralCode ?? "");
  const [error, setError] = useState("");
  const [pending, startT] = useTransition();

  function handleSave() {
    setError("");
    startT(async () => {
      const res = await updateBayiProfile(user.id, {
        name: name || undefined,
        email: email || null,
        b2bMarkup: markup !== "" ? Number(markup) : null,
        b2bNote: note || null,
        segment: segment || null,
        referralCode: refCode || null,
      });
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-sm shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-medium text-[#2c1810]">Profil Düzenle</h3>
          <button onClick={onClose} className="text-[#b8a89e] hover:text-[#2c1810] text-lg">✕</button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Ad Soyad</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e]" />
            </div>
            <div>
              <label className="field-label">E-posta</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Segment</label>
              <select value={segment} onChange={(e) => setSegment(e.target.value)}
                className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e] bg-white">
                <option value="">—</option>
                <option value="DIAMOND">Diamond</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="BRONZE">Bronze</option>
              </select>
            </div>
            <div>
              <label className="field-label">Markup (+₺)</label>
              <input type="number" min="0" value={markup} onChange={(e) => setMarkup(e.target.value)}
                className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e] text-right" />
            </div>
          </div>
          <div>
            <label className="field-label">Referral Kodu</label>
            <input value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e] font-mono uppercase" />
          </div>
          <div>
            <label className="field-label">Not</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e] resize-none" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-xs text-[#8b6f5e] border border-[#d4c5ba] hover:border-[#8b6f5e]">İptal</button>
          <button onClick={handleSave} disabled={pending}
            className="px-5 py-2 text-xs bg-[#2c1810] text-white hover:bg-[#3d2418] disabled:opacity-50 uppercase tracking-widest">
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function BayiDetailClient({
  user, stats, orders, debts, referrals, topProducts,
}: {
  user: User; stats: Stats; orders: Order[]; debts: Debt[]; referrals: Referral[]; topProducts: TopProduct[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [, startT] = useTransition();
  const [activeTab, setActiveTab] = useState<"orders" | "debts" | "referrals" | "products">("orders");

  return (
    <div>
      {editOpen && <EditProfileModal user={user} onClose={() => setEditOpen(false)} />}

      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-white border border-[#e8ddd6] rounded-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-xl font-medium text-[#2c1810]">{user.name ?? "—"}</h2>
              {user.segment && SEGMENT_BADGE[user.segment] && (
                <span className={`text-[9px] px-2 py-0.5 rounded font-semibold tracking-wide ${SEGMENT_BADGE[user.segment]}`}>
                  {user.segment}
                </span>
              )}
              {user.isB2BApproved && (
                <span className="text-[9px] px-2 py-0.5 rounded font-semibold bg-[#2c1810] text-[#c4a882] tracking-wide">Bayi</span>
              )}
            </div>
            <p className="text-sm text-[#5c4033] mb-0.5">{user.phone}</p>
            {user.email && <p className="text-xs text-[#8b6f5e]">{user.email}</p>}
            <p className="text-xs text-[#b8a89e] mt-1">
              Kayıt: {new Date(user.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              {user.referralCode && <> · Ref kodu: <span className="font-mono font-bold text-[#8b6f5e]">{user.referralCode}</span></>}
            </p>
            {user.b2bNote && <p className="text-xs text-[#8b6f5e] mt-1 italic">"{user.b2bNote}"</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditOpen(true)}
              className="border border-[#d4c5ba] text-[#5c4033] text-xs px-4 py-2 hover:bg-[#f5f0eb] transition-colors">
              Düzenle
            </button>
            {user.isB2BApproved && (
              <button onClick={() => startT(async () => { await revokeB2B(user.id); router.refresh(); })}
                className="border border-red-200 text-red-600 text-xs px-4 py-2 hover:bg-red-50 transition-colors">
                Bayi İptal
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5 pt-5 border-t border-[#f0e8e0]">
          {[
            { label: "Sipariş", value: stats.orderCount.toString() },
            { label: "Toplam Harcama", value: `${stats.totalSpend.toLocaleString("tr-TR")} ₺` },
            { label: "Bekleyen Ödeme", value: `${stats.pendingPayment.toLocaleString("tr-TR")} ₺`, warn: stats.pendingPayment > 0 },
            { label: "Borç Bakiye", value: `${stats.totalDebt.toLocaleString("tr-TR")} ₺`, warn: stats.totalDebt > 0 },
            { label: "Referral", value: stats.referralCount.toString() },
          ].map(({ label, value, warn }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] text-[#b8a89e] uppercase tracking-wide mb-0.5">{label}</p>
              <p className={`text-base font-semibold ${warn ? "text-red-600" : "text-[#2c1810]"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Markup highlight */}
        {user.b2bMarkup != null && (
          <div className="mt-3 pt-3 border-t border-[#f0e8e0] flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#b8a89e]">Uygulanan Markup:</span>
            <span className="text-sm font-semibold text-[#2c1810]">+{user.b2bMarkup.toLocaleString("tr-TR")} ₺</span>
            <span className="text-[10px] text-[#b8a89e]">· Geliş fiyatı üzerine</span>
          </div>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-[#e8ddd6] mb-6">
        {(["orders", "debts", "referrals", "products"] as const).map((tab) => {
          const labels = { orders: `Siparişler (${orders.length})`, debts: `Borç/Alacak (${debts.length})`, referrals: `Referrallar (${referrals.length})`, products: "En Çok Satılan" };
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs tracking-wide transition-colors border-b-2 ${activeTab === tab ? "border-[#2c1810] text-[#2c1810] font-medium" : "border-transparent text-[#8b6f5e] hover:text-[#2c1810]"}`}>
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Orders Tab ─────────────────────────────────── */}
      {activeTab === "orders" && (
        <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#b8a89e]">Henüz sipariş yok.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#f9f5f2] border-b border-[#e8ddd6]">
                <tr>
                  {["Sipariş No", "Tarih", "Ürünler", "Tutar", "Durum", "Ödeme"].map((h) => (
                    <th key={h} className="text-left text-[10px] uppercase tracking-widest text-[#8b6f5e] px-4 py-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => {
                  const s = STATUS_LABEL[o.status] ?? { label: o.status, cls: "bg-gray-100 text-gray-700" };
                  const p = PAY_LABEL[o.paymentStatus] ?? { label: o.paymentStatus, cls: "bg-gray-100 text-gray-700" };
                  const itemSummary = o.items?.slice(0, 2).map((it) => it.name ?? "—").join(", ") + (o.items?.length > 2 ? ` +${o.items.length - 2}` : "");
                  return (
                    <tr key={o.id} className={`border-b border-[#f0e8e0] ${i % 2 === 0 ? "bg-white" : "bg-[#fdfaf8]"}`}>
                      <td className="px-4 py-3 font-mono text-xs text-[#5c4033]">{o.orderNo}</td>
                      <td className="px-4 py-3 text-xs text-[#8b6f5e] whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#5c4033] max-w-[200px] truncate">{itemSummary || "—"}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#2c1810] whitespace-nowrap">
                        {o.total.toLocaleString("tr-TR")} ₺
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${p.cls}`}>{p.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-[#e8ddd6] bg-[#f9f5f2]">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-xs text-[#8b6f5e]">Toplam {orders.length} sipariş</td>
                  <td className="px-4 py-2 text-sm font-semibold text-[#2c1810]">
                    {orders.reduce((s, o) => s + o.total, 0).toLocaleString("tr-TR")} ₺
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* ── Debts Tab ──────────────────────────────────── */}
      {activeTab === "debts" && (
        <div className="space-y-3">
          {debts.length === 0 ? (
            <div className="bg-white border border-[#e8ddd6] rounded-sm py-12 text-center text-sm text-[#b8a89e]">
              Bu kullanıcıya ait borç/alacak kaydı bulunamadı.
            </div>
          ) : debts.map((d) => {
            const remaining = d.totalAmount - d.paidAmount;
            const pct = d.totalAmount > 0 ? Math.round((d.paidAmount / d.totalAmount) * 100) : 0;
            return (
              <div key={d.id} className="bg-white border border-[#e8ddd6] rounded-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-medium text-[#2c1810]">{d.description}</p>
                    {d.orderNo && <p className="text-xs text-[#8b6f5e]">Sipariş: {d.orderNo}</p>}
                    <p className="text-xs text-[#b8a89e]">{new Date(d.createdAt).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[#8b6f5e]">Toplam: <span className="font-semibold text-[#2c1810]">{d.totalAmount.toLocaleString("tr-TR")} ₺</span></p>
                    <p className="text-xs text-[#8b6f5e]">Ödenen: <span className="text-green-700 font-semibold">{d.paidAmount.toLocaleString("tr-TR")} ₺</span></p>
                    <p className={`text-xs font-semibold ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>
                      {remaining > 0 ? `Kalan: ${remaining.toLocaleString("tr-TR")} ₺` : "Ödendi ✓"}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-[#f0e8e0] rounded-full h-1.5">
                  <div className="bg-[#2c1810] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                {d.payments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#f0e8e0] space-y-1">
                    {d.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs text-[#8b6f5e]">
                        <span>{new Date(p.paidAt).toLocaleDateString("tr-TR")} {p.note && `· ${p.note}`}</span>
                        <span className="font-semibold text-green-700">+{p.amount.toLocaleString("tr-TR")} ₺</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Referrals Tab ──────────────────────────────── */}
      {activeTab === "referrals" && (
        <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
          {referrals.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#b8a89e]">
              Bu bayinin referral kodu ile henüz kimse kayıt olmamış.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#f9f5f2] border-b border-[#e8ddd6]">
                <tr>
                  {["Ad Soyad", "Telefon", "Segment", "Kayıt", "Sipariş"].map((h) => (
                    <th key={h} className="text-left text-[10px] uppercase tracking-widest text-[#8b6f5e] px-4 py-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={r.id} className={`border-b border-[#f0e8e0] ${i % 2 === 0 ? "bg-white" : "bg-[#fdfaf8]"}`}>
                    <td className="px-4 py-3 text-xs text-[#2c1810] font-medium">{r.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#5c4033]">{r.phone}</td>
                    <td className="px-4 py-3">
                      {r.segment && SEGMENT_BADGE[r.segment] ? (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${SEGMENT_BADGE[r.segment]}`}>{r.segment}</span>
                      ) : <span className="text-[10px] text-[#b8a89e]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8b6f5e]">{new Date(r.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td className="px-4 py-3 text-xs text-[#2c1810] font-semibold">{r.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Top Products Tab ───────────────────────────── */}
      {activeTab === "products" && (
        <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#b8a89e]">Henüz sipariş ürün verisi yok.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#f9f5f2] border-b border-[#e8ddd6]">
                <tr>
                  {["#", "Ürün", "Toplam Adet", "Toplam Tutar"].map((h) => (
                    <th key={h} className="text-left text-[10px] uppercase tracking-widest text-[#8b6f5e] px-4 py-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className={`border-b border-[#f0e8e0] ${i % 2 === 0 ? "bg-white" : "bg-[#fdfaf8]"}`}>
                    <td className="px-4 py-3 text-xs text-[#b8a89e] w-8">{i + 1}</td>
                    <td className="px-4 py-3 text-xs text-[#2c1810] font-medium">{p.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-[#2c1810] rounded-full" style={{ width: `${Math.round((p.qty / topProducts[0].qty) * 80)}px` }} />
                        <span className="text-xs font-semibold text-[#2c1810]">{p.qty} adet</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#2c1810]">{p.total.toLocaleString("tr-TR")} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
