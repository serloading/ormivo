"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface Brand { id: string; name: string; slug: string; }
interface User  { name: string; email: string; }

const KATEGORILER = [
  { href: "/urunler?kategori=kadin",  label: "Kadın" },
  { href: "/urunler?kategori=erkek",  label: "Erkek" },
  { href: "/urunler?kategori=unisex", label: "Unisex" },
];

const WA = "https://wa.me/905465402113";

export default function SiteHeader({
  brands,
  user,
  cartCount,
}: {
  brands:     Brand[];
  user:       User | null;
  cartCount:  number;
}) {
  const pathname  = usePathname();
  const [open, setOpen]           = useState(false);
  const [markaOpen, setMarkaOpen] = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const markaRef  = useRef<HTMLDivElement>(null);
  const userRef   = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); setMarkaOpen(false); setUserOpen(false); }, [pathname]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (markaRef.current && !markaRef.current.contains(e.target as Node)) setMarkaOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Harflere göre grupla
  const grouped: Record<string, Brand[]> = {};
  for (const b of brands) {
    const letter = b.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(b);
  }
  const letters = Object.keys(grouped).sort();

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-[#E8E4DE] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between gap-8">

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex flex-col gap-[5px] p-1 shrink-0"
            aria-label="Menü"
          >
            <span className={`block w-6 h-[1.5px] bg-[#1A1A1A] transition-all duration-300 origin-left ${open ? "rotate-45 translate-x-[1px]" : ""}`} />
            <span className={`block h-[1.5px] bg-[#1A1A1A] transition-all duration-300 ${open ? "w-0 opacity-0" : "w-6"}`} />
            <span className={`block w-6 h-[1.5px] bg-[#1A1A1A] transition-all duration-300 origin-left ${open ? "-rotate-45 translate-x-[1px]" : ""}`} />
          </button>

          {/* Desktop nav — left: kategoriler */}
          <nav className="hidden md:flex items-center gap-7 flex-1">
            {KATEGORILER.map((item) => (
              <Link key={item.href} href={item.href}
                className="nav-link text-[11px] tracking-[0.15em] uppercase font-sans text-[#1A1A1A] hover:text-[#C4A882] transition-colors">
                {item.label}
              </Link>
            ))}

            {/* Markalar dropdown */}
            <div ref={markaRef} className="relative">
              <button
                onClick={() => setMarkaOpen((v) => !v)}
                className={`nav-link text-[11px] tracking-[0.15em] uppercase font-sans transition-colors flex items-center gap-1 ${markaOpen ? "text-[#C4A882]" : "text-[#1A1A1A] hover:text-[#C4A882]"}`}
              >
                Markalar
                <span className={`text-[8px] transition-transform duration-200 ${markaOpen ? "rotate-180" : ""}`}>▾</span>
              </button>

              {/* Mega dropdown */}
              {markaOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[680px] bg-white border border-[#E8E4DE] shadow-2xl z-50">
                  {/* Üst çubuk */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE]">
                    <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-[#C4A882]">Tüm Markalar</p>
                    <Link href="/urunler"
                      onClick={() => setMarkaOpen(false)}
                      className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors">
                      Tümünü Gör →
                    </Link>
                  </div>
                  {/* Alfabe grid */}
                  <div className="p-6 max-h-[420px] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-x-8 gap-y-1">
                      {letters.map((letter) => (
                        <div key={letter}>
                          <p className="font-sans text-[9px] tracking-[0.3em] text-[#C4A882] uppercase mt-3 mb-1 first:mt-0">{letter}</p>
                          {grouped[letter].map((b) => (
                            <Link key={b.slug}
                              href={`/urunler?marka=${b.slug}`}
                              onClick={() => setMarkaOpen(false)}
                              className="block py-0.5 font-sans text-sm text-[#6B6B6B] hover:text-[#C4A882] transition-colors truncate">
                              {b.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Logo — center */}
          <Link href="/"
            className="font-serif text-2xl tracking-[0.35em] text-[#1A1A1A] uppercase hover:text-[#C4A882] transition-colors duration-300 shrink-0">
            Ormivo
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <nav className="hidden md:flex items-center gap-5">
              <Link href="/hakkimizda" className="nav-link text-[11px] tracking-[0.15em] uppercase font-sans text-[#1A1A1A] hover:text-[#C4A882] transition-colors">
                Hakkımızda
              </Link>
              <Link href="/iletisim" className="nav-link text-[11px] tracking-[0.15em] uppercase font-sans text-[#1A1A1A] hover:text-[#C4A882] transition-colors">
                İletişim
              </Link>
            </nav>

            {/* Sepet */}
            <Link href="/sepet" className="relative text-[#1A1A1A] hover:text-[#C4A882] transition-colors" aria-label="Sepet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C4A882] text-white text-[8px] font-sans font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Kullanıcı menüsü */}
            {user ? (
              <div ref={userRef} className="relative hidden md:block">
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[#1A1A1A] hover:text-[#C4A882] transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-[#EDE5D8] flex items-center justify-center font-sans text-[10px] font-bold text-[#C4A882] uppercase">
                    {user.name[0]}
                  </span>
                  <span className="text-[10px] tracking-wide font-sans hidden lg:block">{user.name.split(" ")[0]}</span>
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[#E8E4DE] shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-[#E8E4DE]">
                      <p className="font-sans text-xs font-semibold text-[#1A1A1A] truncate">{user.name}</p>
                      <p className="font-sans text-[10px] text-[#9A9A9A] truncate">{user.email}</p>
                    </div>
                    <Link href="/sepet" onClick={() => setUserOpen(false)}
                      className="block px-4 py-2.5 font-sans text-sm text-[#1A1A1A] hover:bg-[#F5F0EA] transition-colors">
                      Sepetim
                    </Link>
                    <form action="/api/auth/logout" method="POST">
                      <button type="submit"
                        className="w-full text-left px-4 py-2.5 font-sans text-sm text-[#9A9A9A] hover:bg-[#F5F0EA] hover:text-red-500 transition-colors border-t border-[#E8E4DE]">
                        Çıkış Yap
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/giris" className="hidden md:flex items-center gap-1.5 font-sans text-[11px] tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                Giriş
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? "max-h-[600px] border-t border-[#E8E4DE]" : "max-h-0"} bg-white`}>
          <nav className="px-6 py-4 flex flex-col gap-0">
            {KATEGORILER.map((item) => (
              <Link key={item.href} href={item.href}
                className="py-3 text-sm tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border-b border-[#E8E4DE] transition-colors">
                {item.label}
              </Link>
            ))}
            {/* Markalar accordion mobil */}
            <details className="border-b border-[#E8E4DE]">
              <summary className="py-3 text-sm tracking-[0.15em] uppercase text-[#1A1A1A] cursor-pointer list-none flex items-center justify-between">
                Markalar <span className="text-[#C4A882] text-xs">▾</span>
              </summary>
              <div className="pb-3 max-h-56 overflow-y-auto grid grid-cols-2 gap-x-4">
                {brands.map((b) => (
                  <Link key={b.slug} href={`/urunler?marka=${b.slug}`}
                    className="py-1.5 text-sm text-[#6B6B6B] hover:text-[#C4A882] transition-colors truncate">
                    {b.name}
                  </Link>
                ))}
              </div>
            </details>
            <Link href="/sepet" className="py-3 text-sm tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border-b border-[#E8E4DE] transition-colors flex items-center justify-between">
              Sepetim
              {cartCount > 0 && <span className="bg-[#C4A882] text-white text-[9px] rounded-full px-1.5 py-0.5">{cartCount}</span>}
            </Link>
            {user ? (
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="w-full text-left py-3 text-sm tracking-[0.15em] uppercase text-[#9A9A9A] hover:text-red-500 border-b border-[#E8E4DE] transition-colors">
                  Çıkış Yap
                </button>
              </form>
            ) : (
              <Link href="/giris" className="py-3 text-sm tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border-b border-[#E8E4DE] transition-colors">
                Giriş Yap / Kayıt Ol
              </Link>
            )}
            <Link href="/hakkimizda" className="py-3 text-sm tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border-b border-[#E8E4DE] transition-colors">
              Hakkımızda
            </Link>
            <Link href="/iletisim" className="py-3 text-sm tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border-b border-[#E8E4DE] transition-colors">
              İletişim
            </Link>
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center gap-3 text-sm tracking-widest text-[#25D366] uppercase">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              +90 546 540 2113
            </a>
          </nav>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-[72px]" />
    </>
  );
}
