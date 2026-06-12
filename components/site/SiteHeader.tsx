"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/urunler", label: "Koleksiyon" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-b border-[#e8ddd6] bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-light tracking-[0.4em] text-[#2c1810] uppercase hover:opacity-70 transition-opacity"
        >
          Ormivo
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs tracking-widest uppercase transition-colors ${
                pathname === item.href
                  ? "text-[#2c1810] border-b border-[#2c1810] pb-0.5"
                  : "text-[#5c4033] hover:text-[#2c1810]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* WhatsApp */}
          <a
            href="https://wa.me/905465402113"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-block text-xs tracking-widest text-[#5c4033] uppercase border border-[#d4c5ba] px-4 py-2 hover:bg-[#f5f0eb] transition-colors"
          >
            WhatsApp
          </a>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menü"
          >
            <span
              className={`block w-6 h-px bg-[#2c1810] transition-all duration-200 ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-6 h-px bg-[#2c1810] transition-all duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-px bg-[#2c1810] transition-all duration-200 ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#e8ddd6] bg-white px-6 py-6 flex flex-col gap-5">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm tracking-widest text-[#5c4033] uppercase"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://wa.me/905465402113"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm tracking-widest text-[#5c4033] uppercase"
          >
            WhatsApp
          </a>
        </div>
      )}
    </header>
  );
}
