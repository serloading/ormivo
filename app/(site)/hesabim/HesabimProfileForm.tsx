"use client";

import { useState, useTransition } from "react";
import { updateSiteUserProfile } from "@/lib/actions/auth";

type Section = "profile" | "password" | null;

export default function HesabimProfileForm({ currentName, phone }: { currentName: string; phone: string }) {
  const [section, setSection] = useState<Section>(null);

  // Profil (isim + telefon)
  const [name,  setName]  = useState(currentName);
  const [tel,   setTel]   = useState(phone);
  const [savedName, setSavedName] = useState(currentName);
  const [savedTel,  setSavedTel]  = useState(phone);

  // Şifre
  const [curPw,  setCurPw]  = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [newPw2, setNewPw2] = useState("");

  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startT]   = useTransition();

  const inp = "w-full border border-[#E8E4DE] focus:border-[#C4A882] outline-none px-3 py-2 font-sans text-sm text-[#1A1A1A] bg-[#FAFAF7]";

  function close() { setSection(null); setError(""); setSuccess(""); }

  function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    startT(async () => {
      const res = await updateSiteUserProfile({ name, phone: tel });
      if (res.error) { setError(res.error); return; }
      setSavedName(name); setSavedTel(tel);
      setSuccess("Bilgileriniz güncellendi.");
      setTimeout(close, 1200);
    });
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (newPw !== newPw2) { setError("Yeni şifreler eşleşmiyor."); return; }
    startT(async () => {
      const res = await updateSiteUserProfile({ currentPassword: curPw, newPassword: newPw });
      if (res.error) { setError(res.error); return; }
      setSuccess("Şifreniz değiştirildi.");
      setCurPw(""); setNewPw(""); setNewPw2("");
      setTimeout(close, 1200);
    });
  }

  return (
    <div className="bg-white border border-[#E8E4DE] p-5 space-y-4">
      <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882]">Profil</h2>

      {/* Bilgi özeti */}
      {section === null && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-sm text-[#1A1A1A]">{savedName || "—"}</p>
              <p className="font-sans text-xs text-[#9A9A9A]">{savedTel}</p>
            </div>
            <button
              onClick={() => { setName(savedName); setTel(savedTel); setSection("profile"); }}
              className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border border-[#E8E4DE] px-2 py-1 transition-colors"
            >
              Düzenle
            </button>
          </div>
          <button
            onClick={() => setSection("password")}
            className="w-full text-left font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] hover:text-[#C4A882] border border-[#E8E4DE] px-3 py-2 transition-colors"
          >
            Şifre Değiştir →
          </button>
        </div>
      )}

      {/* Profil düzenleme */}
      {section === "profile" && (
        <form onSubmit={submitProfile} className="space-y-3">
          <div>
            <label className="font-sans text-[10px] text-[#9A9A9A] block mb-1">Ad Soyad</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Ad Soyad" autoFocus />
          </div>
          <div>
            <label className="font-sans text-[10px] text-[#9A9A9A] block mb-1">Telefon</label>
            <input value={tel} onChange={(e) => setTel(e.target.value)} className={inp} placeholder="05xx xxx xx xx" type="tel" />
          </div>
          {error   && <p className="font-sans text-xs text-red-500">{error}</p>}
          {success && <p className="font-sans text-xs text-green-600">{success}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isPending}
              className="flex-1 bg-[#1A1A1A] text-white font-sans text-[10px] tracking-[0.2em] uppercase py-2 hover:bg-[#C4A882] transition-colors disabled:opacity-50">
              {isPending ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button type="button" onClick={() => { close(); setName(savedName); setTel(savedTel); }}
              className="px-4 border border-[#E8E4DE] text-[#9A9A9A] font-sans text-[10px] tracking-[0.2em] uppercase hover:border-[#C4A882] transition-colors">
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Şifre değiştirme */}
      {section === "password" && (
        <form onSubmit={submitPassword} className="space-y-3">
          <div>
            <label className="font-sans text-[10px] text-[#9A9A9A] block mb-1">Mevcut Şifre</label>
            <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} className={inp} autoFocus />
          </div>
          <div>
            <label className="font-sans text-[10px] text-[#9A9A9A] block mb-1">Yeni Şifre</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inp} placeholder="En az 8 karakter" />
          </div>
          <div>
            <label className="font-sans text-[10px] text-[#9A9A9A] block mb-1">Yeni Şifre (Tekrar)</label>
            <input type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} className={inp} />
          </div>
          {error   && <p className="font-sans text-xs text-red-500">{error}</p>}
          {success && <p className="font-sans text-xs text-green-600">{success}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isPending}
              className="flex-1 bg-[#1A1A1A] text-white font-sans text-[10px] tracking-[0.2em] uppercase py-2 hover:bg-[#C4A882] transition-colors disabled:opacity-50">
              {isPending ? "Değiştiriliyor…" : "Şifreyi Değiştir"}
            </button>
            <button type="button" onClick={close}
              className="px-4 border border-[#E8E4DE] text-[#9A9A9A] font-sans text-[10px] tracking-[0.2em] uppercase hover:border-[#C4A882] transition-colors">
              İptal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
