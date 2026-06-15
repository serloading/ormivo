import ProductCard from "@/components/site/ProductCard";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Koleksiyon — Ormivo" };

export default async function UrunlerPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; marka?: string }>;
}) {
  const { kategori = "tumu", marka = "" } = await searchParams;

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null, isActive: true,
        ...(kategori !== "tumu" ? { category: { slug: kategori } } : {}),
        ...(marka ? { brand: { slug: marka } } : {}),
      },
      include: { category: true, brand: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  const activeLabel =
    kategori !== "tumu"
      ? categories.find((c) => c.slug === kategori)?.name
      : marka
        ? brands.find((b) => b.slug === marka)?.name
        : null;

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      {/* Page header */}
      <div className="bg-[#F5F0EA] border-b border-[#E8E4DE] py-16 text-center">
        <p className="font-sans text-[10px] tracking-[0.5em] text-[#C4A882] uppercase mb-4">Ormivo</p>
        <h1 className="font-serif text-5xl font-light text-[#1A1A1A] mb-3">Koleksiyon</h1>
        {activeLabel && (
          <p className="font-serif italic text-[#8B6F4E] text-lg">{activeLabel}</p>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Kategori filtresi */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <a
            href="/urunler"
            className={`font-sans text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 border transition-colors duration-200 ${
              kategori === "tumu" && !marka
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "border-[#E8E4DE] text-[#6B6B6B] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
            }`}
          >
            Tümü
          </a>
          {categories.map((cat) => (
            <a
              key={cat.slug}
              href={`/urunler?kategori=${cat.slug}${marka ? `&marka=${marka}` : ""}`}
              className={`font-sans text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 border transition-colors duration-200 ${
                kategori === cat.slug
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "border-[#E8E4DE] text-[#6B6B6B] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
              }`}
            >
              {cat.name}
            </a>
          ))}
        </div>

        {/* Marka filtresi */}
        {brands.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {brands.map((b) => (
              <a
                key={b.slug}
                href={`/urunler?${kategori !== "tumu" ? `kategori=${kategori}&` : ""}marka=${b.slug}`}
                className={`font-sans text-[9px] tracking-[0.15em] uppercase px-4 py-2 border rounded-full transition-colors duration-200 ${
                  marka === b.slug
                    ? "bg-[#C4A882] text-white border-[#C4A882]"
                    : "border-[#E8E4DE] text-[#9A9A9A] hover:border-[#C4A882] hover:text-[#8B6F4E]"
                }`}
              >
                {b.name}
              </a>
            ))}
          </div>
        )}

        <p className="font-sans text-xs text-[#9A9A9A] text-center mb-10 tracking-wide">
          {products.length} ürün
        </p>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p as never} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="font-serif italic text-[#C4A882] text-xl mb-3">Koku bulunamadı</p>
            <p className="font-sans text-sm text-[#9A9A9A]">Bu filtrede henüz ürün yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
