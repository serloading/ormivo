"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/urunler?kategori=kadin",          label: "Kadın" },
  { href: "/urunler?kategori=erkek",          label: "Erkek" },
  { href: "/urunler?kategori=unisex",         label: "Unisex" },
  { href: "/urunler?kategori=ozel-koleksiyon", label: "Özel Koleksiyon" },
  { href: "/hakkimizda",                      label: "Hakkımızda" },
];

const WA = "https://wa.me/905465402113";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-[#E8E4DE] shadow-sm"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
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

          {/* Desktop nav — left */}
          <nav className="hidden md:flex items-center gap-8 flex-1">
            {NAV.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link text-[11px] tracking-[0.15em] uppercase font-sans text-[#1A1A1A] transition-colors hover:text-[#C4A882] ${
                  pathname.includes(item.href.split("?")[0]) && item.href !== "/" ? "active" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logo — center */}
          <Link
            href="/"
            className="font-serif text-2xl tracking-[0.35em] text-[#1A1A1A] uppercase hover:text-[#C4A882] transition-colors duration-300 shrink-0"
          >
            Ormivo
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-6 flex-1 justify-end">
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/hakkimizda"
                className="nav-link text-[11px] tracking-[0.15em] uppercase font-sans text-[#1A1A1A] hover:text-[#C4A882] transition-colors"
              >
                Hakkımızda
              </Link>
            </nav>

            {/* WhatsApp icon */}
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex items-center gap-2 text-[#1A1A1A] hover:text-[#25D366] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="hidden lg:block text-[11px] tracking-widest uppercase">WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            open ? "max-h-[400px] border-t border-[#E8E4DE]" : "max-h-0"
          } bg-white`}
        >
          <nav className="px-6 py-6 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-3 text-sm tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#C4A882] border-b border-[#E8E4DE] last:border-0 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-3 text-sm tracking-widest text-[#25D366] uppercase"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              +90 546 540 2113
            </a>
          </nav>
        </div>
      </header>

      {/* Header yüksekliği için spacer */}
      <div className="h-[72px]" />
    </>
  );
}
