"use client";

import { useState, useTransition } from "react";
import { updateSegmentDiscount, updateDiamondMarkup, updateTransferInfo } from "@/lib/actions/settings";

interface SegmentRates { BRONZE: number; SILVER: number; GOLD: number; DIAMOND: number; }

const SEGMENT_META = [
  { key: "DIAMOND" as const, label: "Diamond Üye", color: "bg-cyan-600 text-white", kind: "markup" as const },
  { key: "BRONZE"  as const, label: "Bronz Üye",   color: "bg-amber-700 text-white", kind: "percent" as const },
  { key: "SILVER"  as const, label: "Gümüş Üye",   color: "bg-slate-400 text-white", kind: "percent" as const },
  { key: "GOLD"    as const, label: "Altın Üye",   color: "bg-yellow-500 text-white", kind: "percent" as const },
];

export default function AyarlarClient({ segmentRates: initialRates, transferInfo: initTransferInfo }: { segmentRates: SegmentRates; transferInfo: string }) {
  const [rates, setRates] = useState(initialRates);
  const [rateInputs, setRateInputs] = useState({
    DIAMOND: String(initialRates.DIAMOND),
    BRONZE:  String(initialRates.BRONZE),
    SILVER:  String(initialRates.SILVER),
    GOLD:    String(initialRates.GOLD),
  });
  const [rateSaving, startRateSave] = useTransition();
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const [transferText, setTransferText] = useState(initTransferInfo);
  const [transferSaving, startTransferSave] = useTransition();
  const [transferSaved, setTransferSaved] = useState(false);

  function handleTransferSave() {
    startTransferSave(async () => {
      await updateTransferInfo(transferText);
      setTransferSaved(true);
      setTimeout(() => setTransferSaved(false), 2000);
    });
  }

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
                  type="number" min="0" step="1"
                  value={rateInputs[key]}
                  onChange={(e) => setRateInputs((r) => ({ ...r, [key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRateSave(key); }}
                  className="w-24 border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e]"
                  disabled={rateSaving}
                />
                <span className="text-sm text-[#8b6f5e]">{kind === "markup" ? "₺" : "%"}</span>
                <button onClick={() => handleRateSave(key)} disabled={rateSaving}
                  className="text-xs bg-[#2c1810] text-[#f5f0eb] px-3 py-2 hover:bg-[#3d2418] disabled:opacity-40 transition-colors">
                  {savedKey === key ? "✓ Kaydedildi" : "Kaydet"}
                </button>
              </div>
              <p className="text-xs text-[#b8a89e] mt-2">
                {kind === "markup" ? (
                  <>Aktif tutar: <strong className="text-[#2c1810]">+{rates[key].toLocaleString("tr-TR")} ₺</strong>{" "}→ 1.000 ₺ ürün = {(1000 + rates[key]).toLocaleString("tr-TR")} ₺</>
                ) : (
                  <>Aktif oran: <strong className="text-[#2c1810]">%{rates[key]}</strong>{" "}→ 1.000 ₺ ürün = {Math.round(1000 * (1 - rates[key] / 100)).toLocaleString("tr-TR")} ₺</>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Havale / EFT Bilgileri */}
      <div>
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810] mb-1">Havale / EFT Bilgileri</h2>
        <p className="text-sm text-[#8b6f5e] mb-5">Normal müşterilerin sipariş özetine eklenecek banka hesap bilgileri.</p>
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-5 max-w-xl">
          <label className="block text-xs text-[#8b6f5e] mb-2">Banka Bilgileri (örn: Banka Adı — Ad Soyad — IBAN)</label>
          <textarea
            rows={4}
            value={transferText}
            onChange={(e) => setTransferText(e.target.value)}
            placeholder={"Ziraat Bankası\nOrmivo Parfümeri\nTR00 0000 0000 0000 0000 0000 00"}
            className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] resize-none font-mono"
            disabled={transferSaving}
          />
          <button
            onClick={handleTransferSave}
            disabled={transferSaving}
            className="mt-3 text-xs bg-[#2c1810] text-[#f5f0eb] px-4 py-2 hover:bg-[#3d2418] disabled:opacity-40 transition-colors"
          >
            {transferSaved ? "✓ Kaydedildi" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
