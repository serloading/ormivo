"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  cartCount: number;
  loggedIn:  boolean;
}

const NAV = [
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
    href:  "/urunler",
    exact: false,
    label: "Ürünler",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
  },
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

export default function BottomNav({ cartCount, loggedIn }: Props) {
  const pathname = usePathname();
  const [guestCount, setGuestCount] = useState(0);

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

  const total = cartCount + guestCount;

  function isActive(item: typeof NAV[number]) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#E8E4DE] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="max-w-[1440px] mx-auto flex">
        {NAV.map((item) => {
          const active = isActive(item);
          const href   = item.href === "/hesabim" && !loggedIn ? "/giris" : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative
                ${active ? "text-[#C4A882]" : "text-[#9A9A9A] hover:text-[#1A1A1A]"}`}
            >
              {/* Sepet badge */}
              {item.href === "/sepet" ? (
                <span className="relative">
                  {item.icon}
                  {total > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#C4A882] text-white text-[8px] font-sans font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {total > 9 ? "9+" : total}
                    </span>
                  )}
                </span>
              ) : (
                item.icon
              )}

              <span className={`font-sans text-[9px] tracking-[0.1em] uppercase leading-none
                ${active ? "text-[#C4A882]" : ""}`}>
                {item.label}
              </span>

              {/* Aktif çizgi */}
              {active && (
                <span className="absolute top-0 inset-x-4 h-[2px] bg-[#C4A882] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
