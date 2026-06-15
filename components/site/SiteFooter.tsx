import Link from "next/link";

const LINKS = [
  { href: "/urunler?kategori=kadin",          label: "Kadın Parfümleri" },
  { href: "/urunler?kategori=erkek",          label: "Erkek Parfümleri" },
  { href: "/urunler?kategori=unisex",         label: "Unisex" },
  { href: "/urunler?kategori=ozel-koleksiyon", label: "Özel Koleksiyon" },
  { href: "/hakkimizda",                      label: "Hakkımızda" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-[#1A1A1A] text-white">
      {/* Accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C4A882] to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-14">

          {/* Kolon 1: Logo + slogan */}
          <div>
            <Link href="/" className="font-serif text-3xl tracking-[0.35em] uppercase text-white hover:text-[#C4A882] transition-colors block mb-4">
              Ormivo
            </Link>
            <p className="font-serif italic text-[#C4A882] text-base mb-4 leading-relaxed">
              Her koku bir hikaye anlatır.
            </p>
            <p className="text-[#9A9A9A] text-sm leading-relaxed font-sans">
              Dünyanın en prestijli parfüm evlerinden özenle seçilmiş, eşsiz kreasyonlar.
            </p>
          </div>

          {/* Kolon 2: Hızlı linkler */}
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-[#C4A882] mb-6 font-sans">
              Koleksiyon
            </h4>
            <ul className="space-y-3">
              {LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}
                    className="text-sm text-[#9A9A9A] hover:text-white transition-colors font-sans tracking-wide">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolon 3: İletişim */}
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase text-[#C4A882] mb-6 font-sans">
              İletişim
            </h4>
            <p className="text-[#9A9A9A] text-sm mb-4 font-sans">
              Sipariş ve danışma için WhatsApp&apos;tan ulaşın.
            </p>
            <a
              href="https://wa.me/905465402113?text=Merhaba,%20parfüm%20siparişi%20vermek%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 group"
            >
              <span className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </span>
              <span className="text-white text-lg font-sans font-light tracking-wide group-hover:text-[#C4A882] transition-colors">
                +90 546 540 2113
              </span>
            </a>
          </div>
        </div>

        {/* Alt bar */}
        <div className="border-t border-[#2A2A2A] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#5A5A5A] text-xs font-sans tracking-wide">
            © {new Date().getFullYear()} Ormivo. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-5">
            {/* Instagram */}
            <a href="#" aria-label="Instagram" className="text-[#5A5A5A] hover:text-[#C4A882] transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
