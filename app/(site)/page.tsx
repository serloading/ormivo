import Link from "next/link";
import ProductCard from "@/components/site/ProductCard";
import { prisma } from "@/lib/prisma";

const WA = "905465402113";

const CATEGORIES = [
  { slug: "kadin",           label: "Kadın",          sub: "Feminen & zarif kreasyonlar" },
  { slug: "erkek",           label: "Erkek",          sub: "Güçlü & maskülen imzalar" },
  { slug: "unisex",          label: "Unisex",         sub: "Sınır tanımayan kokular" },
  { slug: "ozel-koleksiyon", label: "Özel Koleksiyon", sub: "Niş & avangard parfümler" },
];

const PILLARS = [
  {
    num: "01",
    title: "Seçkin Kürasyon",
    desc: "Dünyanın dört bir yanındaki prestijli parfüm evlerinin en nadide kreasyonlarını sizin için bir araya getiriyoruz.",
  },
  {
    num: "02",
    title: "Orijinallik Garantisi",
    desc: "Her ürün, resmi distribütörlerden temin edilir ve orijinallik sertifikasıyla teslim edilir.",
  },
  {
    num: "03",
    title: "Kişisel Danışmanlık",
    desc: "Hangi kokuyu aradığınızdan emin değil misiniz? WhatsApp'tan yazın, size özel öneri sunalım.",
  },
];

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    include: { category: true, brand: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="bg-[#FAFAF7]">

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#F5F0EA]">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(circle, #1A1A1A 1px, transparent 1px)", backgroundSize: "36px 36px" }}
        />

        {/* Dekoratif daire */}
        <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#C4A882]/20 pointer-events-none hidden lg:block" />
        <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-[#C4A882]/10 pointer-events-none hidden lg:block" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto animate-fade-up">
          <p className="font-sans text-[10px] tracking-[0.6em] text-[#C4A882] uppercase mb-8">
            Lüks Parfüm Koleksiyonu
          </p>

          <h1 className="font-serif text-7xl md:text-9xl font-light tracking-[0.2em] text-[#1A1A1A] uppercase mb-6 leading-none">
            Ormivo
          </h1>

          <p className="font-serif italic text-xl text-[#8B6F4E] mb-3">
            Her koku bir hikaye anlatır.
          </p>

          <div className="w-20 h-[1px] bg-[#C4A882] mx-auto my-8" />

          <p className="font-sans text-[#6B6B6B] text-base leading-relaxed max-w-md mx-auto mb-12">
            Dünyaca ünlü parfüm evlerinden özenle seçilmiş, zamansız kreasyonlar. Siparişlerinizi WhatsApp üzerinden kolayca verin.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/urunler"
              className="font-sans bg-[#1A1A1A] text-white text-[11px] tracking-[0.3em] uppercase px-12 py-4 hover:bg-[#C4A882] transition-colors duration-300"
            >
              Koleksiyonu Keşfet
            </Link>
            <a
              href={`https://wa.me/${WA}?text=${encodeURIComponent("Merhaba, parfüm önerisi almak istiyorum.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans border border-[#1A1A1A] text-[#1A1A1A] text-[11px] tracking-[0.3em] uppercase px-12 py-4 hover:bg-[#1A1A1A] hover:text-white transition-colors duration-300"
            >
              WhatsApp&apos;tan Yaz
            </a>
          </div>
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section className="border-y border-[#E8E4DE] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#E8E4DE]">
          {PILLARS.map((p) => (
            <div key={p.num} className="px-8 py-8 md:py-0 first:pl-0 last:pr-0">
              <p className="font-serif italic text-[#C4A882] text-sm mb-3">{p.num}</p>
              <h3 className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#1A1A1A] mb-3">{p.title}</h3>
              <p className="font-sans text-sm text-[#6B6B6B] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ÖNE ÇIKAN ÜRÜNLER ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="font-sans text-[10px] tracking-[0.5em] text-[#C4A882] uppercase mb-3">Seçkin Kreasyonlar</p>
            <h2 className="font-serif text-4xl font-light text-[#1A1A1A]">Öne Çıkan Parfümler</h2>
          </div>
          <Link
            href="/urunler"
            className="hidden md:block font-sans text-[11px] tracking-[0.2em] uppercase text-[#6B6B6B] hover:text-[#1A1A1A] border-b border-[#E8E4DE] hover:border-[#1A1A1A] pb-1 transition-colors"
          >
            Tümünü Gör
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product as never} />
          ))}
        </div>

        <div className="text-center mt-10 md:hidden">
          <Link href="/urunler" className="font-sans text-sm text-[#6B6B6B] uppercase tracking-widest border-b border-[#E8E4DE] pb-1">
            Tüm Koleksiyonu Gör
          </Link>
        </div>
      </section>

      {/* ── KATEGORİLER ── */}
      <section className="bg-[#F5F0EA] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="font-sans text-[10px] tracking-[0.5em] text-[#C4A882] uppercase mb-3">Kategoriler</p>
            <h2 className="font-serif text-4xl font-light text-[#1A1A1A]">Kendinize Ait Kokuyu Bulun</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/urunler?kategori=${c.slug}`}
                className="group bg-white border border-[#E8E4DE] p-8 md:p-10 flex flex-col gap-3 hover:border-[#C4A882] hover:shadow-md transition-all duration-300"
              >
                <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#C4A882] group-hover:text-[#8B6F4E] transition-colors">
                  Ormivo
                </span>
                <h3 className="font-serif text-xl md:text-2xl text-[#1A1A1A] group-hover:text-[#8B6F4E] transition-colors">
                  {c.label}
                </h3>
                <p className="font-sans text-xs text-[#6B6B6B] leading-relaxed">{c.sub}</p>
                <span className="font-sans text-[10px] tracking-widest uppercase text-[#C4A882] mt-2 group-hover:translate-x-1 transition-transform inline-block">
                  Keşfet →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-[#1A1A1A] text-white py-24 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #C4A882 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <p className="font-sans text-[10px] tracking-[0.6em] text-[#C4A882] uppercase mb-6">
            Kişisel Danışmanlık
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light mb-4 leading-tight">
            Hangi Koku Sizi <br />
            <em className="italic text-[#C4A882]">Anlatıyor?</em>
          </h2>
          <p className="font-sans text-[#9A9A9A] text-base leading-relaxed mb-10 max-w-md mx-auto">
            Size özel parfüm önerileri için WhatsApp&apos;tan yazın. Uzman ekibimiz en uygun kreasyonu bulmana yardımcı olsun.
          </p>
          <a
            href={`https://wa.me/${WA}?text=${encodeURIComponent("Merhaba, bana özel parfüm önerisi almak istiyorum.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] text-white font-sans text-[11px] tracking-[0.3em] uppercase px-10 py-4 hover:bg-[#20BA5A] transition-colors rounded-none"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Şimdi Mesaj Gönder
          </a>
        </div>
      </section>
    </div>
  );
}
