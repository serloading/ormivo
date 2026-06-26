"use client";

import { useState, useTransition } from "react";
import { updateSiteUserName } from "@/lib/actions/auth";

export default function HesabimProfileForm({ currentName, phone }: { currentName: string; phone: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saved, setSaved] = useState(currentName);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const res = await updateSiteUserName(fd);
      if (res.error) { setError(res.error); return; }
      setSaved(name);
      setEditing(false);
    });
  }

  return (
    <div className="bg-white border border-[#E8E4DE] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882]">Profil</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border border-[#E8E4DE] px-2 py-1 transition-colors"
          >
            Düzenle
          </button>
        )}
      </div>
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-sans text-[10px] text-[#9A9A9A] block mb-1">Ad Soyad</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#E8E4DE] focus:border-[#C4A882] outline-none px-3 py-2 font-sans text-sm text-[#1A1A1A] bg-[#FAFAF7]"
              placeholder="Ad Soyad"
              autoFocus
            />
          </div>
          <p className="font-sans text-xs text-[#9A9A9A]">{phone}</p>
          {error && <p className="font-sans text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-[#1A1A1A] text-white font-sans text-[10px] tracking-[0.2em] uppercase py-2 hover:bg-[#C4A882] transition-colors disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setName(saved); setError(""); }}
              className="px-4 border border-[#E8E4DE] text-[#9A9A9A] font-sans text-[10px] tracking-[0.2em] uppercase hover:border-[#C4A882] transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="font-sans text-sm text-[#1A1A1A] mb-0.5">{saved || "—"}</p>
          <p className="font-sans text-xs text-[#9A9A9A]">{phone}</p>
        </>
      )}
    </div>
  );
}
