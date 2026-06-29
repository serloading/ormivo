"use client";

import { useState, useTransition } from "react";
import { createCoupon, updateCoupon, deleteCoupon } from "@/lib/actions/coupon";
import { updateSegmentDiscount, updateDiamondMarkup } from "@/lib/actions/settings";

interface Coupon {
  id: string; code: string; discountType: string; discountValue: number;
  minOrderTotal: number | null; maxUses: number | null; usedCount: number;
  isActive: boolean; expiresAt: string | null; createdAt: string;
}

interface SegmentRates {
  BRONZE: number;
  SILVER: number;
  GOLD: number;
  DIAMOND: number;
}

const empty = { code: "", discountType: "PERCENT", discountValue: "", minOrderTotal: "", maxUses: "", expiresAt: "", isActive: true };

const SEGMENT_META = [
  { key: "DIAMOND" as const, label: "Diamond Üye", color: "bg-cyan-600 text-white", kind: "markup" as const },
  { key: "BRONZE" as const, label: "Bronz Üye", color: "bg-amber-700 text-white", kind: "percent" as const },
  { key: "SILVER" as const, label: "Gümüş Üye", color: "bg-slate-400 text-white", kind: "percent" as const },
  { key: "GOLD" as const, label: "Altın Üye", color: "bg-yellow-500 text-white", kind: "percent" as const },
];

export default function KuponlarClient({
  coupons,
  segmentRates: initialRates,
}: { coupons: Coupon[]; segmentRates: SegmentRates }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, startSave] = useTransition();
  const [deleting, startDel] = useTransition();

  const [rates, setRates] = useState(initialRates);
  const [rateInputs, setRateInputs] = useState({
    DIAMOND: String(initialRates.DIAMOND),
    BRONZE: String(initialRates.BRONZE),
    SILVER: String(initialRates.SILVER),
    GOLD: String(initialRates.GOLD),
  });
  const [rateSaving, startRateSave] = useTransition();
  const [savedKey, setSavedKey] = useState<string | null>(null);

  function handleRateSave(segment: keyof SegmentRates) {
    const val = parseFloat(rateInputs[segment]);
    if (Number.isNaN(val) || val < 0) return;
    setRates((r) => ({ ...r, [segment]: val }));
    startRateSave(async () => {
      if (segment === "DIAMOND") await updateDiamondMarkup(val);
      else await updateSegmentDiscount(segment, val);
      setSavedKey(segment);
      setTimeout(() => setSavedKey(null), 2000);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startSave(async () => {
      await createCoupon({
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderTotal: form.minOrderTotal ? Number(form.minOrderTotal) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
        isActive: form.isActive,
      });
      setForm(empty);
      setShowForm(false);
    });
  }

  function toggleActive(id: string, isActive: boolean) {
    startSave(async () => { await updateCoupon(id, { isActive: !isActive }); });
  }

  function handleDelete(id: string) {
    if (!confirm("Bu kuponu silmek istediğinizden emin misiniz?")) return;
    startDel(async () => { await deleteCoupon(id); });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810] mb-1">Segment İndirim Oranları</h2>
        <p className="text-sm text-[#8b6f5e] mb-5">Üye segmentlerine göre ürün fiyatlarına uygulanacak kurallar.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {SEGMENT_META.map(({ key, label, color, kind }) => (
            <div key={key} className="bg-white border border-[#e8ddd6] rounded-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[11px] px-2.5 py-1 rounded font-semibold ${color}`}>{label}</span>
              </div>
              <label className="block text-xs text-[#8b6f5e] mb-1">
                {kind === "markup" ? "Sabit Ekleme Tutarı (₺)" : "İndirim Oranı (%)"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={rateInputs[key]}
                  onChange={(e) => setRateInputs((r) => ({ ...r, [key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRateSave(key); }}
                  className="w-24 border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e]"
                  disabled={rateSaving}
                />
                <span className="text-sm text-[#8b6f5e]">{kind === "markup" ? "₺" : "%"}</span>
                <button
                  onClick={() => handleRateSave(key)}
                  disabled={rateSaving}
                  className="text-xs bg-[#2c1810] text-[#f5f0eb] px-3 py-2 hover:bg-[#3d2418] disabled:opacity-40 transition-colors"
                >
                  {savedKey === key ? "✓ Kaydedildi" : "Kaydet"}
                </button>
              </div>
              <p className="text-xs text-[#b8a89e] mt-2">
                {kind === "markup" ? (
                  <>
                    Aktif tutar: <strong className="text-[#2c1810]">+{rates[key].toLocaleString("tr-TR")} ₺</strong>
                    {" "}→ 1.000 ₺ ürün = {(1000 + rates[key]).toLocaleString("tr-TR")} ₺
                  </>
                ) : (
                  <>
                    Aktif oran: <strong className="text-[#2c1810]">%{rates[key]}</strong>
                    {" "}→ 1.000 ₺ ürün = {Math.round(1000 * (1 - rates[key] / 100)).toLocaleString("tr-TR")} ₺
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Kupon Kodları</h2>
            <p className="text-sm text-[#8b6f5e] mt-1">{coupons.length} kupon</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-5 py-2.5 hover:bg-[#3d2418] transition-colors">
            + Yeni Kupon
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-[#e8ddd6] rounded-sm p-6 space-y-4 mb-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-2">Yeni Kupon</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#8b6f5e] mb-1">Kupon Kodu *</label>
                <input required value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="HOSGELDIN20"
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] uppercase" />
              </div>
              <div>
                <label className="block text-xs text-[#8b6f5e] mb-1">İndirim Tipi *</label>
                <select value={form.discountType} onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] bg-white">
                  <option value="PERCENT">Yüzde (%)</option>
                  <option value="FIXED">Sabit Tutar (₺)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#8b6f5e] mb-1">
                  İndirim Değeri * {form.discountType === "PERCENT" ? "(%)" : "(₺)"}
                </label>
                <input required type="number" min="1" max={form.discountType === "PERCENT" ? "100" : undefined}
                  value={form.discountValue} onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                  placeholder={form.discountType === "PERCENT" ? "20" : "100"}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e]" />
              </div>
              <div>
                <label className="block text-xs text-[#8b6f5e] mb-1">Min. Sipariş Tutarı (₺)</label>
                <input type="number" min="0" value={form.minOrderTotal} onChange={(e) => setForm((p) => ({ ...p, minOrderTotal: e.target.value }))}
                  placeholder="500 (opsiyonel)"
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e]" />
              </div>
              <div>
                <label className="block text-xs text-[#8b6f5e] mb-1">Maksimum Kullanım</label>
                <input type="number" min="1" value={form.maxUses} onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                  placeholder="100 (opsiyonel)"
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e]" />
              </div>
              <div>
                <label className="block text-xs text-[#8b6f5e] mb-1">Son Kullanım Tarihi</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e]" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="w-4 h-4 accent-[#2c1810]" />
              <span className="text-sm text-[#5c4033]">Aktif (hemen kullanılabilir)</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-2.5 hover:bg-[#3d2418] disabled:opacity-50">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-[#8b6f5e] px-4">İptal</button>
            </div>
          </form>
        )}

        <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
          {coupons.length === 0 ? (
            <div className="py-16 text-center text-[#b8a89e] text-sm">Henüz kupon eklenmemiş.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ddd6] bg-[#faf8f6] text-xs text-[#8b6f5e] uppercase tracking-widest text-left">
                  <th className="px-4 py-3">Kod</th>
                  <th className="px-4 py-3">İndirim</th>
                  <th className="px-4 py-3">Min. Tutar</th>
                  <th className="px-4 py-3">Kullanım</th>
                  <th className="px-4 py-3">Son Tarih</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-[#f0ebe6] last:border-0 hover:bg-[#faf8f6]">
                    <td className="px-4 py-3 font-mono font-bold text-[#2c1810] tracking-wider">{c.code}</td>
                    <td className="px-4 py-3 text-[#5c4033]">
                      {c.discountType === "PERCENT" ? `%${c.discountValue}` : `${c.discountValue.toLocaleString("tr-TR")} ₺`}
                    </td>
                    <td className="px-4 py-3 text-[#8b6f5e]">
                      {c.minOrderTotal ? `${c.minOrderTotal.toLocaleString("tr-TR")} ₺` : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#8b6f5e]">
                      {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3 text-[#8b6f5e]">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("tr-TR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(c.id, c.isActive)}
                        className={`text-xs px-2 py-1 rounded-sm border ${c.isActive ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                        {c.isActive ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(c.id)} disabled={deleting}
                        className="text-xs text-red-400 hover:text-red-600">Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
