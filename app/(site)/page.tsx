import Link from "next/link";
import ProductCard from "@/components/site/ProductCard";
import { prisma } from "@/lib/prisma";

const WA_NUMBER = "905465402113";

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <div className="bg-[#faf8f6]">
      {/* Hero */}
      <section className="min-h-[70vh] flex items-center justify-center bg-[#f5f0eb] border-b border-[#e8ddd6]">
        <div className="text-center px-6">
          <p className="text-xs tracking-[0.5em] text-[#8b6f5e] uppercase mb-6">
            Lüks Parfüm
          </p>
          <h1 className="text-5xl md:text-7xl font-light tracking-[0.2em] text-[#2c1810] uppercase mb-6">
            Ormivo
          </h1>
          <p className="text-sm tracking-widest text-[#5c4033] max-w-md mx-auto leading-relaxed mb-10">
            Her koku bir hikaye. Özenle seçilmiş, zamansız parfüm koleksiyonu.
          </p>
          <Link
            href="/urunler"
            className="inline-block border border-[#2c1810] text-[#2c1810] text-xs tracking-[0.3em] uppercase px-10 py-4 hover:bg-[#2c1810] hover:text-[#f5f0eb] transition-colors"
          >
            Koleksiyonu Keşfet
          </Link>
        </div>
      </section>

      {/* Öne çıkan ürünler */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.4em] text-[#8b6f5e] uppercase mb-3">
            Koleksiyon
          </p>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
            Öne Çıkan Parfümler
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product as never} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/urunler"
            className="text-xs tracking-widest text-[#5c4033] uppercase border-b border-[#5c4033] pb-1 hover:text-[#2c1810] hover:border-[#2c1810] transition-colors"
          >
            Tüm Koleksiyonu Gör
          </Link>
        </div>
      </section>

      {/* Alt banner */}
      <section className="bg-[#2c1810] text-[#f5f0eb] py-16 text-center">
        <p className="text-xs tracking-[0.5em] uppercase text-[#8b6f5e] mb-4">
          Sipariş İçin
        </p>
        <h2 className="text-2xl font-light tracking-wide mb-6">
          WhatsApp&apos;tan bize ulaşın
        </h2>
        <a
          href={`https://wa.me/${WA_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border border-[#f5f0eb] text-[#f5f0eb] text-xs tracking-[0.3em] uppercase px-10 py-4 hover:bg-[#f5f0eb] hover:text-[#2c1810] transition-colors"
        >
          +90 546 540 2113
        </a>
      </section>
    </div>
  );
}
