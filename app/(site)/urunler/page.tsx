import ProductCard from "@/components/site/ProductCard";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Koleksiyon — Ormivo",
};

export default async function UrunlerPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori: aktifKategori = "tumu" } = await searchParams;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...(aktifKategori !== "tumu" ? { category: { slug: aktifKategori } } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="bg-[#faf8f6] min-h-screen">
      <div className="border-b border-[#e8ddd6] bg-[#f5f0eb] py-16 text-center">
        <p className="text-xs tracking-[0.5em] text-[#8b6f5e] uppercase mb-3">Ormivo</p>
        <h1 className="text-3xl font-light tracking-[0.2em] text-[#2c1810] uppercase">Koleksiyon</h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          <a href="/urunler"
            className={`px-5 py-2 text-xs tracking-widest uppercase border transition-colors ${aktifKategori === "tumu" ? "bg-[#2c1810] text-[#f5f0eb] border-[#2c1810]" : "border-[#d4c5ba] text-[#5c4033] hover:bg-[#f5f0eb]"}`}>
            Tümü
          </a>
          {categories.map((cat) => (
            <a key={cat.slug} href={`/urunler?kategori=${cat.slug}`}
              className={`px-5 py-2 text-xs tracking-widest uppercase border transition-colors ${aktifKategori === cat.slug ? "bg-[#2c1810] text-[#f5f0eb] border-[#2c1810]" : "border-[#d4c5ba] text-[#5c4033] hover:bg-[#f5f0eb]"}`}>
              {cat.name}
            </a>
          ))}
        </div>

        <p className="text-xs text-[#b8a89e] text-center mb-8">{products.length} ürün</p>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as never} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#b8a89e] text-sm">Bu kategoride ürün bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
