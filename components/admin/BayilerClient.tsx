"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addB2BByPhone } from "@/lib/actions/b2b";

export function BayiEkleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [markup, setMarkup] = useState("500");
  const [note, setNote] = useState("");
  const [segment, setSegment] = useState("DIAMOND");
  const [error, setError] = useState("");
  const [isPending, startT] = useTransition();

  function handleAdd() {
    if (!phone) return;
    setError("");
    startT(async () => {
      const res = await addB2BByPhone(phone, Number(markup) || 500, {
        name: name || undefined,
        email: email || undefined,
        note: note || undefined,
        segment: segment || undefined,
      });
      if (res.error) { setError(res.error); return; }
      setOpen(false);
      resetForm();
      router.refresh();
    });
  }

  function resetForm() {
    setPhone(""); setName(""); setEmail(""); setMarkup("500"); setNote(""); setSegment("DIAMOND"); setError("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-[#2c1810] text-white text-[11px] tracking-widest uppercase px-4 py-2 hover:bg-[#8b6f5e] transition-colors"
      >
        + Bayi Ekle
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setOpen(false); resetForm(); }}>
      <div className="bg-white rounded-sm shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-medium text-[#2c1810]">Bayi Ekle</h3>
          <button onClick={() => { setOpen(false); resetForm(); }} className="text-[#b8a89e] hover:text-[#2c1810] text-lg">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#8b6f5e] block mb-1">Telefon *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx"
              className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#8b6f5e] block mb-1">Ad Soyad</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="(mevcut üyeden alınır)"
                className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#8b6f5e] block mb-1">E-posta</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="—"
                className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#8b6f5e] block mb-1">Segment</label>
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
              <label className="text-[10px] uppercase tracking-widest text-[#8b6f5e] block mb-1">Markup (+₺)</label>
              <input type="number" min="0" value={markup} onChange={(e) => setMarkup(e.target.value)}
                className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e] text-right" />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#8b6f5e] block mb-1">Not</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Bayi hakkında not..."
              className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e] resize-none" />
          </div>
        </div>

        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => { setOpen(false); resetForm(); }}
            className="px-4 py-2 text-xs text-[#8b6f5e] hover:text-[#2c1810] border border-[#d4c5ba] hover:border-[#8b6f5e]">
            İptal
          </button>
          <button onClick={handleAdd} disabled={isPending || !phone}
            className="px-5 py-2 text-xs bg-[#2c1810] text-white hover:bg-[#3d2418] disabled:opacity-50 uppercase tracking-widest">
            {isPending ? "Ekleniyor..." : "Bayi Olarak Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}
