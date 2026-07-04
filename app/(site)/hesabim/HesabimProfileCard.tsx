"use client";

import { useState, useTransition } from "react";
import { updateSiteUserProfile } from "@/lib/actions/auth";
import { SEGMENT_LABELS, SEGMENT_COLORS } from "@/lib/segment";

const SEGMENT_ICONS: Record<string, string> = {
  BRONZE: "🥉",
  SILVER: "🥈",
  GOLD:   "🏅",
};


type Mode = null | "profile" | "password";

interface Props {
  name:      string;
  phone:     string;
  email?:    string | null;
  segment:   string | null;
  initials:  string;
  orderCount: number;
  addressCount: number;
  favoriteCount: number;
  birthDate?: string | null;
}

export default function HesabimProfileCard({
  name, phone, email: initEmail, segment, initials,
  orderCount, addressCount, favoriteCount, birthDate: initBirthDate,
}: Props) {
  const [mode,    setMode]    = useState<Mode>(null);
  const [isPending, startT]   = useTransition();
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  // Profil alanları
  const [curName, setCurName] = useState(name);
  const [curPhone, setCurPhone] = useState(phone);
  const [curEmail, setCurEmail] = useState(initEmail ?? "");
  const [curBirthDate, setCurBirthDate] = useState(initBirthDate ? initBirthDate.slice(0, 10) : "");
  const [dispBirthDate, setDispBirthDate] = useState(initBirthDate ? initBirthDate.slice(0, 10) : "");
  const [dispName, setDispName] = useState(name);
  const [dispPhone, setDispPhone] = useState(phone);


  // Şifre alanları
  const [curPw,  setCurPw]  = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [newPw2, setNewPw2] = useState("");

  const inp = "w-full border border-[#E8E4DE] focus:border-[#C4A882] outline-none px-3 py-2.5 font-sans text-sm text-[#1A1A1A] bg-white transition-colors";

  function reset() { setError(""); setSuccess(""); }

  function openProfile() {
    reset();
    setCurName(dispName);
    setCurPhone(dispPhone);
    setCurBirthDate(dispBirthDate);
    setMode("profile");
  }


  function openPassword() { reset(); setCurPw(""); setNewPw(""); setNewPw2(""); setMode("password"); }
  function closeAll() { setMode(null); reset(); }

  function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    reset();
    startT(async () => {
      const res = await updateSiteUserProfile({ name: curName, phone: curPhone, email: curEmail, birthDate: curBirthDate || null });
      if (res.error) { setError(res.error); return; }
      setDispName(curName);
      setDispPhone(curPhone);
      setDispBirthDate(curBirthDate);
      setSuccess("Bilgileriniz güncellendi.");
      setTimeout(closeAll, 1400);
    });
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    reset();
    if (newPw !== newPw2) { setError("Yeni şifreler eşleşmiyor."); return; }
    if (newPw.length < 6) { setError("Şifre en az 6 karakter olmalı."); return; }
    startT(async () => {
      const res = await updateSiteUserProfile({ currentPassword: curPw, newPassword: newPw });
      if (res.error) { setError(res.error); return; }
      setSuccess("Şifreniz başarıyla değiştirildi.");
      setTimeout(closeAll, 1400);
    });
  }

  return (
    <div className="bg-white border border-[#E8E4DE]">
      {/* ── Ana profil satırı ── */}
      <div className="p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-[#EDE5D8] flex items-center justify-center shrink-0">
            <span className="font-serif text-xl text-[#C4A882]">{initials}</span>
          </div>

          {/* İsim + Rozet + Telefon */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-xl text-[#1A1A1A] leading-tight">
                {dispName || "Üye"}
              </h1>
              {segment && SEGMENT_LABELS[segment] && (
                <span className={`inline-flex items-center gap-1 font-sans text-[10px] px-2 py-0.5 rounded font-semibold ${SEGMENT_COLORS[segment]}`}>
                  <span>{SEGMENT_ICONS[segment] ?? "◆"}</span>
                  {SEGMENT_LABELS[segment]}
                </span>
              )}
            </div>
            <p className="font-sans text-sm text-[#9A9A9A] mt-0.5">{dispPhone}</p>
            {dispBirthDate && (
              <p className="font-sans text-xs text-[#9A9A9A] mt-0.5">
                {new Date(dispBirthDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Butonlar */}
          {mode === null && (
            <div className="hidden md:flex flex-col gap-1.5 shrink-0">
              <button onClick={openProfile}
                className="font-sans text-[9px] tracking-[0.15em] uppercase border border-[#E8E4DE] px-3 py-1.5 text-[#6B6B6B] hover:border-[#C4A882] hover:text-[#C4A882] transition-colors">
                Profil Düzenle
              </button>
              <button onClick={openPassword}
                className="font-sans text-[9px] tracking-[0.15em] uppercase border border-[#E8E4DE] px-3 py-1.5 text-[#6B6B6B] hover:border-[#C4A882] hover:text-[#C4A882] transition-colors">
                Şifre Değiştir
              </button>
            </div>
          )}
        </div>

        {/* Mobil butonlar */}
        {mode === null && (
          <div className="flex gap-2 mt-4 md:hidden">
            <button onClick={openProfile}
              className="flex-1 font-sans text-[9px] tracking-[0.15em] uppercase border border-[#E8E4DE] py-2 text-[#6B6B6B] hover:border-[#C4A882] hover:text-[#C4A882] transition-colors">
              Profil Düzenle
            </button>
            <button onClick={openPassword}
              className="flex-1 font-sans text-[9px] tracking-[0.15em] uppercase border border-[#E8E4DE] py-2 text-[#6B6B6B] hover:border-[#C4A882] hover:text-[#C4A882] transition-colors">
              Şifre Değiştir
            </button>
          </div>
        )}

        {/* ── Profil düzenleme formu ── */}
        {mode === "profile" && (
          <form onSubmit={submitProfile} className="mt-5 pt-5 border-t border-[#E8E4DE] space-y-3">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882] mb-3">Profil Düzenle</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-sans text-[9px] tracking-[0.15em] uppercase text-[#9A9A9A] mb-1.5">Ad Soyad</label>
                <input autoFocus value={curName} onChange={(e) => setCurName(e.target.value)}
                  placeholder="Ad Soyad" className={inp} />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-sans text-[9px] tracking-[0.15em] uppercase text-[#9A9A9A] mb-1.5">Telefon</label>
                <input type="tel" value={curPhone} onChange={(e) => setCurPhone(e.target.value)}
                  placeholder="05XX XXX XX XX" className={inp} />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-sans text-[9px] tracking-[0.15em] uppercase text-[#9A9A9A] mb-1.5">E-posta</label>
                <input type="email" value={curEmail} onChange={(e) => setCurEmail(e.target.value)}
                  placeholder="ornek@mail.com" className={inp} />
              </div>
              <div>
                <label className="block font-sans text-[9px] tracking-[0.15em] uppercase text-[#9A9A9A] mb-1.5">Doğum Tarihi</label>
                <input type="date" value={curBirthDate} onChange={(e) => setCurBirthDate(e.target.value)}
                  className={inp} />
              </div>
            </div>
            {error   && <p className="font-sans text-xs text-red-500 bg-red-50 px-3 py-2">{error}</p>}
            {success && <p className="font-sans text-xs text-green-600 bg-green-50 px-3 py-2">{success}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isPending}
                className="flex-1 bg-[#1A1A1A] text-white font-sans text-[10px] tracking-[0.2em] uppercase py-2.5 hover:bg-[#C4A882] transition-colors disabled:opacity-50">
                {isPending ? "Kaydediliyor…" : "Kaydet"}
              </button>
              <button type="button" onClick={closeAll}
                className="px-5 border border-[#E8E4DE] text-[#9A9A9A] font-sans text-[10px] tracking-[0.15em] uppercase hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
                İptal
              </button>
            </div>
          </form>
        )}

        {/* ── Şifre değiştirme formu ── */}
        {mode === "password" && (
          <form onSubmit={submitPassword} className="mt-5 pt-5 border-t border-[#E8E4DE] space-y-3">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882] mb-3">Şifre Değiştir</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-sans text-[9px] tracking-[0.15em] uppercase text-[#9A9A9A] mb-1.5">Mevcut Şifre</label>
                <input autoFocus type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block font-sans text-[9px] tracking-[0.15em] uppercase text-[#9A9A9A] mb-1.5">Yeni Şifre</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="En az 6 karakter" className={inp} />
              </div>
              <div>
                <label className="block font-sans text-[9px] tracking-[0.15em] uppercase text-[#9A9A9A] mb-1.5">Yeni Şifre (Tekrar)</label>
                <input type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} className={inp} />
              </div>
            </div>
            {error   && <p className="font-sans text-xs text-red-500 bg-red-50 px-3 py-2">{error}</p>}
            {success && <p className="font-sans text-xs text-green-600 bg-green-50 px-3 py-2">{success}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isPending}
                className="flex-1 bg-[#1A1A1A] text-white font-sans text-[10px] tracking-[0.2em] uppercase py-2.5 hover:bg-[#C4A882] transition-colors disabled:opacity-50">
                {isPending ? "Değiştiriliyor…" : "Şifreyi Değiştir"}
              </button>
              <button type="button" onClick={closeAll}
                className="px-5 border border-[#E8E4DE] text-[#9A9A9A] font-sans text-[10px] tracking-[0.15em] uppercase hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
                İptal
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Hızlı navigasyon ── */}
      <div className="grid grid-cols-3 border-t border-[#E8E4DE]">
        <a href="#siparisler" className="flex flex-col items-center gap-1.5 py-4 group border-r border-[#E8E4DE]">
          <span className="text-xl">📦</span>
          <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] group-hover:text-[#1A1A1A] transition-colors text-center">Siparişlerim</span>
          <span className="font-sans text-sm font-medium text-[#1A1A1A]">{orderCount}</span>
        </a>
        <a href="#adresler" className="flex flex-col items-center gap-1.5 py-4 group border-r border-[#E8E4DE]">
          <span className="text-xl">📍</span>
          <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] group-hover:text-[#1A1A1A] transition-colors text-center">Adreslerim</span>
          <span className="font-sans text-sm font-medium text-[#1A1A1A]">{addressCount}</span>
        </a>
        <a href="/hesabim/favorilerim" className="flex flex-col items-center gap-1.5 py-4 group">
          <span className="text-xl">♡</span>
          <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] group-hover:text-[#1A1A1A] transition-colors text-center">Favorilerim</span>
          <span className="font-sans text-sm font-medium text-[#1A1A1A]">{favoriteCount}</span>
        </a>
      </div>
    </div>
  );
}
