import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-[#e8ddd6] bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-light tracking-[0.4em] text-[#2c1810] uppercase hover:opacity-70 transition-opacity"
        >
          Ormivo
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {[
            { href: "/urunler", label: "Koleksiyon" },
            { href: "/hakkimizda", label: "Hakkımızda" },
            { href: "/iletisim", label: "İletişim" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs tracking-widest text-[#5c4033] uppercase hover:text-[#2c1810] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* WhatsApp ikonu */}
        <a
          href="https://wa.me/905465402113"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-widest text-[#5c4033] uppercase border border-[#d4c5ba] px-4 py-2 hover:bg-[#f5f0eb] transition-colors"
        >
          WhatsApp
        </a>
      </div>
    </header>
  );
}
