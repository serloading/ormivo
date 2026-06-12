import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-[#2c1810] text-[#f5f0eb] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-lg font-light tracking-[0.4em] uppercase mb-4">
              Ormivo
            </h3>
            <p className="text-sm text-[#b8a89e] leading-relaxed">
              Özenle seçilmiş lüks parfümler. Her koku, bir hikaye.
            </p>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#8b6f5e] mb-4">
              Hızlı Erişim
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/urunler", label: "Koleksiyon" },
                { href: "/hakkimizda", label: "Hakkımızda" },
                { href: "/iletisim", label: "İletişim" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-[#b8a89e] hover:text-[#f5f0eb] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#8b6f5e] mb-4">
              İletişim
            </h4>
            <a
              href="https://wa.me/905465402113"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-[#b8a89e] hover:text-[#f5f0eb] transition-colors"
            >
              WhatsApp: +90 546 540 2113
            </a>
          </div>
        </div>

        <div className="border-t border-[#3d2418] mt-10 pt-6 text-center">
          <p className="text-xs text-[#8b6f5e]">
            © {new Date().getFullYear()} Ormivo. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
