"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Brand { id: string; name: string; slug: string; }
interface User  { name: string | null; phone: string; }

const KATEGORILER = [
  { href: "/?kategori=kadin",  label: "Kadın"  },
  { href: "/?kategori=erkek",  label: "Erkek"  },
  { href: "/?kategori=unisex", label: "UNISEX" },
  { href: "/markalar",         label: "Markalar" },
];

export default function SiteHeader({
  brands,
  user,
  cartCount,
}: {
  brands:    Brand[];
  user:      User | null;
  cartCount: number;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userOpen,     setUserOpen]     = useState(false);
  const [searchQ,      setSearchQ]      = useState("");
  const [mobileSearch, setMobileSearch] = useState("");
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [guestCount,   setGuestCount]   = useState(0);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  const userRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { setMobileOpen(false); setUserOpen(false); }, [pathname]);

  /* Dışarı tıklanınca dropdown kapat */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Misafir sepet sayısı */
  useEffect(() => {
    function read() {
      try {
        const cart: { qty: number }[] = JSON.parse(localStorage.getItem("guest_cart") ?? "[]");
        setGuestCount(cart.reduce((s, i) => s + i.qty, 0));
      } catch { setGuestCount(0); }
    }
    read();
    window.addEventListener("guest-cart-updated", read);
    return () => window.removeEventListener("guest-cart-updated", read);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQ.trim()) return;
    router.push(`/?q=${encodeURIComponent(searchQ.trim())}`);
  }

  const totalCart  = cartCount + guestCount;
  const avatarChar = user?.name?.[0]?.toUpperCase() ?? user?.phone?.slice(-2) ?? "?";

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-[#E8E4DE] shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-[68px] flex items-center gap-5">

          {/* ── LOGO (sol) ── */}
          <Link
            href="/"
            className="font-serif text-2xl tracking-[0.35em] text-[#1A1A1A] hover:text-[#C4A882] transition-colors duration-300 shrink-0"
          >
            Ormivo
          </Link>

          {/* ── SEARCH BAR (logonun sağı, flex-1) ── */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 items-center bg-[#F5F1EC] border border-[#E8E4DE] hover:border-[#C4A882] focus-within:border-[#C4A882] transition-colors px-4 py-2.5 gap-3 max-w-lg"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#C4A882] shrink-0">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Parfüm veya marka ara…"
              className="flex-1 bg-transparent font-sans text-sm text-[#1A1A1A] placeholder-[#B8B4AE] outline-none"
            />
            {searchQ && (
              <button type="button" onClick={() => setSearchQ("")} className="text-[#B8B4AE] hover:text-[#1A1A1A] transition-colors text-lg leading-none">×</button>
            )}
          </form>

          {/* ── SAĞ: Nav + Sepet + Kullanıcı ── */}
          <div className="hidden md:flex items-center gap-1 ml-auto shrink-0">

            {/* Kategori linkleri */}
            {KATEGORILER.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 font-sans text-[11px] tracking-[0.15em] uppercase text-[#4A4A4A] hover:text-[#C4A882] hover:bg-[#FAF7F3] rounded transition-colors"
              >
                {item.label}
              </Link>
            ))}

            {/* Divider */}
            <span className="w-px h-5 bg-[#E8E4DE] mx-1" />

            {/* Search butonu (desktop) */}
            <button
              onClick={() => { setSearchOpen((v) => !v); setTimeout(() => mobileSearchRef.current?.focus(), 50); }}
              className="p-2 text-[#4A4A4A] hover:text-[#C4A882] hover:bg-[#FAF7F3] rounded transition-colors"
              aria-label="Ara"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            {/* Sepet */}
            <Link href="/sepet" className="relative p-2 text-[#4A4A4A] hover:text-[#C4A882] hover:bg-[#FAF7F3] rounded transition-colors" aria-label="Sepet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {totalCart > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#C4A882] text-white text-[8px] font-sans font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalCart > 9 ? "9+" : totalCart}
                </span>
              )}
            </Link>

            {/* Kullanıcı */}
            {user ? (
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1.5 hover:bg-[#FAF7F3] rounded transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-[#EDE5D8] flex items-center justify-center font-sans text-[10px] font-bold text-[#C4A882] uppercase shrink-0">
                    {avatarChar}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3 h-3 text-[#9A9A9A] transition-transform ${userOpen ? "rotate-180" : ""}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E8E4DE] shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-[#E8E4DE] bg-[#FAFAF7]">
                      <p className="font-sans text-xs font-semibold text-[#1A1A1A]">{user.name ?? user.phone}</p>
                      <p className="font-sans text-[10px] text-[#9A9A9A] mt-0.5">{user.phone}</p>
                    </div>
                    <Link href="/hesabim" onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 font-sans text-sm text-[#1A1A1A] hover:bg-[#F5F0EA] transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#C4A882]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" /></svg>
                      Hesabım
                    </Link>
                    <Link href="/sepet" onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 font-sans text-sm text-[#1A1A1A] hover:bg-[#F5F0EA] transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#C4A882]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                      Sepetim
                    </Link>
                    <form action="/api/auth/logout" method="POST">
                      <button type="submit"
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 font-sans text-sm text-[#9A9A9A] hover:bg-[#F5F0EA] hover:text-red-500 transition-colors border-t border-[#E8E4DE]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
                        Çıkış Yap
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/giris"
                className="ml-1 flex items-center gap-2 bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.15em] uppercase px-4 py-2 hover:bg-[#C4A882] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                </svg>
                Giriş Yap
              </Link>
            )}
          </div>

          {/* ── MOBİL: arama + sepet + hamburger ── */}
          <div className="md:hidden flex items-center gap-1 ml-auto">
            {/* Mobil arama butonu */}
            <button
              onClick={() => { setSearchOpen((v) => !v); setMobileOpen(false); setTimeout(() => mobileSearchRef.current?.focus(), 80); }}
              className="p-2 text-[#4A4A4A]"
              aria-label="Ara"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            {/* Mobil sepet ikonu */}
            <Link href="/sepet" className="relative p-2 text-[#4A4A4A]" aria-label="Sepet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {totalCart > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#C4A882] text-white text-[8px] font-sans font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalCart > 9 ? "9+" : totalCart}
                </span>
              )}
            </Link>
            <button
              onClick={() => { setMobileOpen((v) => !v); setSearchOpen(false); }}
              className="p-2 flex flex-col gap-[5px]"
              aria-label="Menü"
            >
              <span className={`block w-5 h-[1.5px] bg-[#1A1A1A] transition-all duration-300 origin-left ${mobileOpen ? "rotate-45 translate-x-[1px]" : ""}`} />
              <span className={`block h-[1.5px] bg-[#1A1A1A] transition-all duration-300 ${mobileOpen ? "w-0 opacity-0" : "w-5"}`} />
              <span className={`block w-5 h-[1.5px] bg-[#1A1A1A] transition-all duration-300 origin-left ${mobileOpen ? "-rotate-45 translate-x-[1px]" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── AÇILIR ARAMA PANELI (hem mobil hem desktop search butonuna bağlı) ── */}
        {searchOpen && (
          <div className="border-t border-[#E8E4DE] bg-white px-4 py-3">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (mobileSearch.trim()) { router.push(`/?q=${encodeURIComponent(mobileSearch.trim())}`); setSearchOpen(false); setMobileSearch(""); }
            }} className="flex items-center bg-[#F5F1EC] border border-[#C4A882] px-4 py-2.5 gap-3 max-w-2xl mx-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#C4A882] shrink-0">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={mobileSearchRef}
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                placeholder="Parfüm veya marka ara…"
                className="flex-1 bg-transparent font-sans text-sm text-[#1A1A1A] placeholder-[#B8B4AE] outline-none"
              />
              {mobileSearch && (
                <button type="button" onClick={() => setMobileSearch("")} className="text-[#B8B4AE] hover:text-[#1A1A1A] text-lg leading-none">×</button>
              )}
              <button type="button" onClick={() => setSearchOpen(false)} className="text-[#B8B4AE] hover:text-[#1A1A1A] text-xs ml-1">Kapat</button>
            </form>
          </div>
        )}

        {/* ── MOBİL MENU ── */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-[600px] border-t border-[#E8E4DE]" : "max-h-0"} bg-white`}>
          {/* Arama (mobil menü içi — kaldırıldı, üstteki search butonu kullanılıyor) */}
          {/* Linkler */}
          <nav className="px-4 py-2 flex flex-col">
            {KATEGORILER.map((item) => (
              <Link key={item.href} href={item.href}
                className="py-3 font-sans text-sm tracking-[0.1em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border-b border-[#F0EDE8] transition-colors">
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <Link href="/hesabim" className="py-3 font-sans text-sm tracking-[0.1em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border-b border-[#F0EDE8] transition-colors">
                  Hesabım
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="w-full text-left py-3 font-sans text-sm tracking-[0.1em] uppercase text-[#9A9A9A] hover:text-red-500 border-b border-[#F0EDE8] transition-colors">
                    Çıkış Yap
                  </button>
                </form>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Header yüksekliği kadar boşluk */}
      <div className="h-[68px]" />
    </>
  );
}
