"use client";

import { useState, useTransition } from "react";
import { updateBankInfo } from "@/lib/actions/auth";

export default function BankInfoCard({ initialBankInfo }: { initialBankInfo: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialBankInfo ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startT] = useTransition();

  function handleSave() {
    startT(async () => {
      await updateBankInfo(value);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white border border-[#E8E4DE] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882]">Banka Hesap Bilgileri</h2>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border border-[#E8E4DE] px-2 py-1 transition-colors">
            {value ? "Düzenle" : "+ Ekle"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <p className="font-sans text-xs text-[#9A9A9A]">
            Müşterilerinize gönderilen sipariş özetlerine bu bilgiler eklenir.
          </p>
          <textarea
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={"Ziraat Bankası\nAd Soyad\nTR00 0000 0000 0000 0000 0000 00"}
            className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors resize-none font-mono"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={pending}
              className="font-sans text-[10px] tracking-[0.15em] uppercase bg-[#1A1A1A] text-white px-4 py-2 hover:bg-[#C4A882] disabled:opacity-50 transition-colors">
              {pending ? "..." : "Kaydet"}
            </button>
            <button onClick={() => { setEditing(false); setValue(initialBankInfo ?? ""); }}
              className="font-sans text-[10px] tracking-[0.15em] uppercase border border-[#E8E4DE] text-[#6B6B6B] px-4 py-2 hover:border-[#C4A882] transition-colors">
              İptal
            </button>
          </div>
        </div>
      ) : (
        <div>
          {saved && <p className="font-sans text-xs text-green-600 mb-2">✓ Kaydedildi</p>}
          {value ? (
            <pre className="font-sans text-xs text-[#4A4A4A] whitespace-pre-wrap leading-relaxed">{value}</pre>
          ) : (
            <p className="font-sans text-xs text-[#9A9A9A]">Henüz banka bilgisi eklenmemiş.</p>
          )}
        </div>
      )}
    </div>
  );
}
