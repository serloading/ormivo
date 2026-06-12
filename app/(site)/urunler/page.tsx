import ProductCard from "@/components/site/ProductCard";
import { mockProducts, mockCategories } from "@/lib/mock-data";

export const metadata = {
  title: "Koleksiyon — Ormivo",
};

export default function UrunlerPage({
  searchParams,
}: {
  searchParams: { kategori?: string };
}) {
  const aktifKategori = searchParams.kategori ?? "tumu";

  const filtrelenmis =
    aktifKategori === "tumu"
      ? mockProducts.filter((p) => p.isActive)
      : mockProducts.filter(
          (p) => p.isActive && p.categorySlug === aktifKategori
        );

  return (
    <div className="bg-[#faf8f6] min-h-screen">
      {/* Başlık */}
      <div className="border-b border-[#e8ddd6] bg-[#f5f0eb] py-16 text-center">
        <p className="text-xs tracking-[0.5em] text-[#8b6f5e] uppercase mb-3">
          Ormivo
        </p>
        <h1 className="text-3xl font-light tracking-[0.2em] text-[#2c1810] uppercase">
          Koleksiyon
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Kategori filtresi */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          <a
            href="/urunler"
            className={`px-5 py-2 text-xs tracking-widest uppercase border transition-colors ${
              aktifKategori === "tumu"
                ? "bg-[#2c1810] text-[#f5f0eb] border-[#2c1810]"
                : "border-[#d4c5ba] text-[#5c4033] hover:bg-[#f5f0eb]"
            }`}
          >
            Tümü
          </a>
          {mockCategories.map((cat) => (
            <a
              key={cat.slug}
              href={`/urunler?kategori=${cat.slug}`}
              className={`px-5 py-2 text-xs tracking-widest uppercase border transition-colors ${
                aktifKategori === cat.slug
                  ? "bg-[#2c1810] text-[#f5f0eb] border-[#2c1810]"
                  : "border-[#d4c5ba] text-[#5c4033] hover:bg-[#f5f0eb]"
              }`}
            >
              {cat.name}
            </a>
          ))}
        </div>

        {/* Ürün sayısı */}
        <p className="text-xs text-[#b8a89e] text-center mb-8">
          {filtrelenmis.length} ürün
        </p>

        {/* Grid */}
        {filtrelenmis.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtrelenmis.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#b8a89e] text-sm">
              Bu kategoride ürün bulunamadı.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
