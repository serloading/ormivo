import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/site/ProductCard";
import { prisma } from "@/lib/prisma";

const WA_NUMBER = "905465402113";

const PILLARS = [
  { icon: "◈", title: "Özgün Seçki", desc: "Dünyanın dört bir yanından, prestijli parfüm evlerinin en özel kreasyonları." },
  { icon: "◇", title: "Hızlı Teslimat", desc: "Siparişiniz WhatsApp üzerinden alınır, aynı gün kargoya verilir." },
  { icon: "◉", title: "Güvenli Alışveriş", desc: "Her ürün orijinallik garantisiyle, özenle paketlenerek teslim edilir." },
];

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    include: { category: true, brand: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="bg-[#faf8f6]">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-[#f0ebe4] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #2c1810 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <p className="text-[10px] tracking-[0.7em] text-[#8b6f5e] uppercase mb-8">Lüks Parfüm Koleksiyonu</p>
          <h1 className="text-6xl md:text-8xl font-light tracking-[0.25em] text-[#2c1810] uppercase mb-8 leading-none">
            Ormivo
          </h1>
          <div className="w-16 h-px bg-[#c4a882] mx-auto mb-8" />
          <p className="text-sm md:text-base tracking-wide text-[#6b4f3f] max-w-sm mx-auto leading-relaxed mb-12 font-light">
            Her koku bir hikaye anlatır. Dünyaca ünlü parfüm evlerinden özenle seçilmiş, zamansız bir koleksiyon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/urunler"
              className="inline-block bg-[#2c1810] text-[#f5f0eb] text-[11px] tracking-[0.35em] uppercase px-10 py-4 hover:bg-[#3d2418] transition-colors">
              Koleksiyonu Keşfet
            </Link>
            <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer"
              className="inline-block border border-[#2c1810] text-[#2c1810] text-[11px] tracking-[0.35em] uppercase px-10 py-4 hover:bg-[#2c1810] hover:text-[#f5f0eb] transition-colors">
              WhatsApp&apos;tan Sipariş
            </a>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-10 bg-[#2c1810] animate-pulse" />
        </div>
      </section>

      {/* Değer önerileri */}
      <section className="border-y border-[#e8ddd6] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {PILLARS.map((p) => (
            <div key={p.title} className="text-center">
              <span className="text-2xl text-[#c4a882] block mb-4">{p.icon}</span>
              <h3 className="text-xs tracking-widest text-[#2c1810] uppercase mb-2">{p.title}</h3>
              <p className="text-sm text-[#8b6f5e] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Öne çıkan ürünler */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-[10px] tracking-[0.6em] text-[#8b6f5e] uppercase mb-4">Seçkin Kreasyonlar</p>
          <h2 className="text-3xl font-light tracking-wide text-[#2c1810]">Öne Çıkan Parfümler</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product as never} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/urunler"
            className="inline-block text-[11px] tracking-[0.35em] text-[#5c4033] uppercase border border-[#c4a882] px-10 py-4 hover:bg-[#2c1810] hover:text-[#f5f0eb] hover:border-[#2c1810] transition-colors">
            Tüm Koleksiyonu Gör
          </Link>
        </div>
      </section>

      {/* Koleksiyon kategorileri */}
      <section className="bg-[#f0ebe4] border-y border-[#e8ddd6] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.6em] text-[#8b6f5e] uppercase mb-4">Kategoriler</p>
            <h2 className="text-3xl font-light tracking-wide text-[#2c1810]">Kendinize Ait Kokuyu Bulun</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Kadın", slug: "kadin", desc: "Feminen & zarif" },
              { label: "Erkek", slug: "erkek", desc: "Güçlü & karizmatik" },
              { label: "Unisex", slug: "unisex", desc: "Sınır tanımayan" },
              { label: "Özel Koleksiyon", slug: "ozel-koleksiyon", desc: "Niş & avangard" },
            ].map((c) => (
              <Link key={c.slug} href={`/urunler?kategori=${c.slug}`}
                className="group bg-white border border-[#e8ddd6] p-8 text-center hover:border-[#2c1810] hover:bg-[#2c1810] transition-all duration-300">
                <h3 className="text-sm tracking-widest uppercase text-[#2c1810] group-hover:text-[#f5f0eb] transition-colors">{c.label}</h3>
                <p className="text-xs text-[#8b6f5e] mt-2 group-hover:text-[#c4a882] transition-colors">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#2c1810] text-[#f5f0eb] py-20 text-center">
        <p className="text-[10px] tracking-[0.7em] uppercase text-[#c4a882] mb-6">Sipariş &amp; Danışma</p>
        <h2 className="text-3xl font-light tracking-wide mb-4">WhatsApp&apos;tan Bize Ulaşın</h2>
        <p className="text-sm text-[#b8a89e] mb-10 max-w-md mx-auto leading-relaxed">
          Hangi kokuyu aradığınızdan emin değil misiniz? Size özel öneri için mesaj atın.
        </p>
        <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Merhaba, parfüm seçimi konusunda yardım almak istiyorum.")}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-block border border-[#c4a882] text-[#f5f0eb] text-[11px] tracking-[0.35em] uppercase px-12 py-4 hover:bg-[#c4a882] hover:text-[#2c1810] transition-colors">
          Şimdi Mesaj Gönder
        </a>
      </section>
    </div>
  );
}
