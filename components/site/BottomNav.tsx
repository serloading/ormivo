"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Props {
  cartCount: number;
  loggedIn:  boolean;
}

export default function BottomNav({ cartCount, loggedIn }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [guestCount,  setGuestCount]  = useState(0);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQ,     setSearchQ]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Sayfa değişince search kapat
  useEffect(() => { setSearchOpen(false); setSearchQ(""); }, [pathname]);

  const total = loggedIn ? cartCount : cartCount + guestCount;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQ.trim()) return;
    router.push(`/?q=${encodeURIComponent(searchQ.trim())}`);
    setSearchOpen(false);
    setSearchQ("");
  }

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // Sıra: Ana Sayfa | Favoriler | Ara | Sepet | Hesabım
  const NAV_LEFT = [
    {
      href:  "/",
      exact: true,
      label: "Ana Sayfa",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      href:  "/hesabim#favoriler",
      exact: false,
      label: "Favoriler",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      ),
    },
  ];

  const NAV_RIGHT = [
    {
      href:  "/sepet",
      exact: false,
      label: "Sepet",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      ),
    },
    {
      href:  "/hesabim",
      exact: false,
      label: "Hesabım",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
        </svg>
      ),
    },
  ];

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href.split("#")[0]);
  }

  function navLink(item: { href: string; exact: boolean; label: string; icon: React.ReactNode }) {
    const active = isActive(item.href, item.exact);
    const href   = item.href.startsWith("/hesabim") && !loggedIn ? "/giris" : item.href;
    const isSepet = item.href === "/sepet";
    return (
      <Link
        key={item.href}
        href={href}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative
          ${active ? "text-[#C4A882]" : "text-[#9A9A9A] hover:text-[#1A1A1A]"}`}
      >
        {isSepet ? (
          <span className="relative">
            {item.icon}
            {total > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#C4A882] text-white text-[8px] font-sans font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {total > 9 ? "9+" : total}
              </span>
            )}
          </span>
        ) : item.icon}
        <span className={`font-sans text-[9px] tracking-[0.1em] uppercase leading-none ${active ? "text-[#C4A882]" : ""}`}>
          {item.label}
        </span>
        {active && <span className="absolute top-0 inset-x-4 h-[2px] bg-[#C4A882] rounded-full" />}
      </Link>
    );
  }

  return (
    <>
      {/* Arama overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setSearchOpen(false)}>
          <div className="bg-white border-t border-[#E8E4DE] shadow-xl px-4 pb-[72px] pt-4" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="flex items-center bg-[#F5F1EC] border border-[#C4A882] px-4 py-3 gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#C4A882] shrink-0">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Parfüm veya marka ara…"
                className="flex-1 bg-transparent font-sans text-sm text-[#1A1A1A] placeholder-[#B8B4AE] outline-none"
              />
              {searchQ ? (
                <button type="button" onClick={() => setSearchQ("")} className="text-[#B8B4AE] text-lg leading-none">×</button>
              ) : (
                <button type="button" onClick={() => setSearchOpen(false)} className="text-[#B8B4AE] text-xs">Kapat</button>
              )}
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#E8E4DE] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1440px] mx-auto flex">
          {NAV_LEFT.map(navLink)}

          {/* Ara — ortada */}
          <button
            onClick={openSearch}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative ${searchOpen ? "text-[#C4A882]" : "text-[#9A9A9A] hover:text-[#1A1A1A]"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span className="font-sans text-[9px] tracking-[0.1em] uppercase leading-none">Ara</span>
          </button>

          {NAV_RIGHT.map(navLink)}
        </div>
      </nav>
    </>
  );
}
