"use client";

import { useState, useTransition } from "react";
import { setUsdRate } from "@/lib/actions/settings";

export default function UsdRateWidget({ initialRate }: { initialRate: number }) {
  const [rate, setRate] = useState(String(initialRate));
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function handleSave() {
    const val = parseFloat(rate);
    if (!val || val <= 0) return;
    start(async () => {
      await setUsdRate(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="flex items-center gap-3 bg-[#fdf8f3] border border-[#e8ddd6] px-4 py-3 rounded-sm">
      <span className="text-xs tracking-widest uppercase text-[#8b6f5e] whitespace-nowrap">$ Dolar Kuru</span>
      <input
        type="number"
        min="1"
        step="0.01"
        value={rate}
        onChange={(e) => { setRate(e.target.value); setSaved(false); }}
        className="w-24 border border-[#d4c5ba] px-2 py-1.5 text-sm text-[#2c1810] outline-none focus:border-[#8b6f5e] text-center"
        placeholder="38.50"
      />
      <span className="text-xs text-[#b8a89e]">TL</span>
      <button
        onClick={handleSave}
        disabled={pending}
        className="text-xs tracking-widest uppercase bg-[#2c1810] text-[#f5f0eb] px-4 py-1.5 hover:bg-[#3d2418] transition-colors disabled:opacity-60"
      >
        {saved ? "✓ Kaydedildi" : pending ? "…" : "Kaydet"}
      </button>
      <span className="text-[10px] text-[#b8a89e]">Yeni siparişlerdeki alış maliyetlerini etkiler · eski siparişler değişmez</span>
    </div>
  );
}
