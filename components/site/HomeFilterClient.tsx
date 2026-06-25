"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category { id: string; name: string; slug: string; }
interface Brand    { id: string; name: string; slug: string; }

interface Props {
  categories:    Category[];
  brands:        Brand[];
  activeKategori: string;
  activeMarka:   string;
  activeSirala:  string;
  activeQ:       string;
}

function buildHref(
  state: { kategori: string; marka: string; sirala: string; q: string },
  key: string,
  value: string,
) {
  const next = { ...state, [key]: value };
  const p = new URLSearchParams();
  if (next.kategori) p.set("kategori", next.kategori);
  if (next.marka)    p.set("marka",    next.marka);
  if (next.sirala)   p.set("sirala",   next.sirala);
  if (next.q)        p.set("q",        next.q);
  return `/${p.toString() ? `?${p}` : ""}`;
}

export default function HomeFilterClient({
  categories, brands,
  activeKategori, activeMarka, activeSirala, activeQ,
}: Props) {
  const [open, setOpen]     = useState(false);
  const [markaQ, setMarkaQ] = useState("");
  const router = useRouter();

  const state = { kategori: activeKategori, marka: activeMarka, sirala: activeSirala, q: activeQ };
  const href  = (k: string, v: string) => buildHref(state, k, v);

  const hasFilter = !!(activeKategori || activeMarka || activeSirala);
  const filteredBrands = markaQ
    ? brands.filter((b) => b.name.toLowerCase().includes(markaQ.toLowerCase()))
    : brands;

  return (
    <div className="md:hidden mb-3">
      {/* Toggle butonu */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white border border-[#E8E4DE] px-4 py-3 font-sans text-[11px] tracking-[0.2em] uppercase text-[#1A1A1A]"
      >
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#C4A882]">
            <path strokeLinecap="round" d="M3 6h18M6 12h12M9 18h6"/>
          </svg>
          Filtrele &amp; Sırala
          {hasFilter && (
            <span className="bg-[#C4A882] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
              {[activeKategori, activeMarka, activeSirala].filter(Boolean).length}
            </span>
          )}
        </span>
        <span className={`text-[#C4A882] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="border border-t-0 border-[#E8E4DE] bg-white px-4 py-5 space-y-5">

          {hasFilter && (
            <a href="/" className="block font-sans text-[10px] tracking-[0.2em] uppercase text-[#C4A882]">
              × Filtreleri Sıfırla
            </a>
          )}

          {/* Kategori */}
          <div>
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-2">Kategori</p>
            <div className="space-y-0">
              <FilterLink href={href("kategori", "")} active={!activeKategori} label="Tümü" onNavigate={() => setOpen(false)} />
              {categories.filter((c) => c.slug !== "unisex" && c.slug !== "ozel-koleksiyon").map((cat) => (
                <FilterLink key={cat.slug} href={href("kategori", cat.slug)} active={activeKategori === cat.slug} label={cat.name} onNavigate={() => setOpen(false)} />
              ))}
              <FilterLink href={href("kategori", "ozel-koleksiyon")} active={activeKategori === "ozel-koleksiyon"} label="Özel Koleksiyon" onNavigate={() => setOpen(false)} />
              {categories.filter((c) => c.slug === "unisex").map((cat) => (
                <FilterLink key={cat.slug} href={href("kategori", cat.slug)} active={activeKategori === cat.slug} label={cat.name} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          </div>

          {/* Sıralama */}
          <div>
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-2">Sıralama</p>
            <div className="space-y-0">
              <FilterLink href={href("sirala", "")} active={!activeSirala} label="Rastgele" onNavigate={() => setOpen(false)} />
              <FilterLink href={href("sirala", "fiyat-artan")} active={activeSirala === "fiyat-artan"} label="Fiyat: Artan" onNavigate={() => setOpen(false)} />
              <FilterLink href={href("sirala", "fiyat-azalan")} active={activeSirala === "fiyat-azalan"} label="Fiyat: Azalan" onNavigate={() => setOpen(false)} />
            </div>
          </div>

          {/* Marka */}
          <div>
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-2">Marka</p>
            <input
              value={markaQ}
              onChange={(e) => setMarkaQ(e.target.value)}
              placeholder="Marka ara..."
              className="w-full border border-[#E8E4DE] px-3 py-2 text-sm font-sans outline-none focus:border-[#C4A882] mb-2"
            />
            <div className="space-y-0 max-h-52 overflow-y-auto">
              <FilterLink href={href("marka", "")} active={!activeMarka} label="Tüm Markalar" onNavigate={() => setOpen(false)} />
              {filteredBrands.map((b) => (
                <FilterLink key={b.slug} href={href("marka", b.slug)} active={activeMarka === b.slug} label={b.name} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterLink({ href, active, label, onNavigate }: { href: string; active: boolean; label: string; onNavigate: () => void }) {
  return (
    <a
      href={href}
      onClick={onNavigate}
      className={`block py-1.5 pl-2 border-l-2 font-sans text-sm transition-colors ${
        active
          ? "border-[#C4A882] text-[#1A1A1A] font-semibold"
          : "border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]"
      }`}
    >
      {label}
    </a>
  );
}
