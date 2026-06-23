"use client";

import { useState } from "react";

interface Category { id: string; name: string; slug: string; }
interface Brand    { id: string; name: string; slug: string; }

interface Props {
  categories:    Category[];
  brands:        Brand[];
  activeKategori: string;
  activeMarka:   string;
  activeSirala:  string;
}

const SIRALA = [
  { value: "fiyat-artan",  label: "Fiyat: Artan" },
  { value: "fiyat-azalan", label: "Fiyat: Azalan" },
];

function buildHref(state: { kategori: string; marka: string; sirala: string }, key: string, value: string) {
  const next = { ...state, [key]: value };
  const p = new URLSearchParams();
  if (next.kategori && next.kategori !== "tumu") p.set("kategori", next.kategori);
  if (next.marka    && next.marka    !== "tumu") p.set("marka",    next.marka);
  if (next.sirala) p.set("sirala", next.sirala);
  return `/urunler${p.toString() ? `?${p}` : ""}`;
}

export default function UrunlerMobileFilter({ categories, brands, activeKategori, activeMarka, activeSirala }: Props) {
  const [open, setOpen]     = useState(false);
  const [markaQ, setMarkaQ] = useState("");

  const state = { kategori: activeKategori, marka: activeMarka, sirala: activeSirala };
  const href  = (k: string, v: string) => buildHref(state, k, v);

  const filteredBrands = markaQ
    ? brands.filter((b) => b.name.toLowerCase().includes(markaQ.toLowerCase()))
    : brands;

  return (
    <div className="md:hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-[#E8E4DE] bg-white px-4 py-3 font-sans text-[11px] tracking-[0.2em] uppercase text-[#1A1A1A]"
      >
        <span>
          Filtrele &amp; Sırala
          {(activeKategori !== "tumu" || activeMarka !== "tumu") && (
            <span className="ml-2 bg-[#C4A882] text-white text-[9px] px-1.5 py-0.5 rounded-full">●</span>
          )}
        </span>
        <span className={`transition-transform duration-200 text-[#C4A882] text-xs ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="border border-t-0 border-[#E8E4DE] bg-white px-5 pt-5 pb-6 space-y-6">

          {/* Kategoriler */}
          <div>
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">Kategoriler</p>
            <div className="space-y-1">
              <a href={href("kategori", "tumu")} onClick={() => setOpen(false)}
                className={`block py-2 font-sans text-sm transition-colors ${activeKategori === "tumu" ? "text-[#C4A882] font-semibold" : "text-[#6B6B6B]"}`}>
                Tüm Ürünler
              </a>
              {categories.map((cat) => (
                <a key={cat.slug} href={href("kategori", cat.slug)} onClick={() => setOpen(false)}
                  className={`block py-2 font-sans text-sm transition-colors ${activeKategori === cat.slug ? "text-[#C4A882] font-semibold" : "text-[#6B6B6B]"}`}>
                  {cat.name}
                </a>
              ))}
            </div>
          </div>

          {/* Markalar */}
          <div>
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">Markalar</p>
            <input
              value={markaQ}
              onChange={(e) => setMarkaQ(e.target.value)}
              placeholder="Marka ara..."
              className="w-full border border-[#E8E4DE] px-3 py-2 text-sm font-sans text-[#1A1A1A] placeholder-[#C8C4BE] outline-none focus:border-[#C4A882] mb-2"
            />
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <a href={href("marka", "tumu")} onClick={() => setOpen(false)}
                className={`block py-2 font-sans text-sm transition-colors ${activeMarka === "tumu" ? "text-[#C4A882] font-semibold" : "text-[#6B6B6B]"}`}>
                Tüm Markalar
              </a>
              {filteredBrands.map((b) => (
                <a key={b.slug} href={href("marka", b.slug)} onClick={() => setOpen(false)}
                  className={`block py-2 font-sans text-sm transition-colors ${activeMarka === b.slug ? "text-[#C4A882] font-semibold" : "text-[#6B6B6B]"}`}>
                  {b.name}
                </a>
              ))}
            </div>
          </div>

          {/* Sıralama */}
          <div>
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">Sıralama</p>
            <div className="space-y-1">
              {SIRALA.map((opt) => (
                <a key={opt.value} href={href("sirala", opt.value)} onClick={() => setOpen(false)}
                  className={`block py-2 font-sans text-sm transition-colors ${activeSirala === opt.value ? "text-[#C4A882] font-semibold" : "text-[#6B6B6B]"}`}>
                  {opt.label}
                </a>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
