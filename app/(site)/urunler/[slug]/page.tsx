import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ProductGallery from "@/components/site/ProductGallery";
import ProductTabs from "@/components/site/ProductTabs";
import ProductAddToCart from "@/components/site/ProductAddToCart";
import AddToCartButton from "@/components/site/AddToCartButton";

// 494 ürünü build'de aynı anda render etmek connection pool'u aşıyor.
// Her istek sunucuda anlık render edilir; fiyat/stok değişimleri de anında yansır.
export const dynamic = "force-dynamic";

// ──────────────────────────────────────────────────────────────
// Dynamic metadata
// ──────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    include: { brand: true, category: true },
  });
  if (!p) return {};

  const title       = `${p.name} — Ormivo`;
  const description = p.description
    ? p.description.slice(0, 160)
    : `${p.brand?.name ?? ""} ${p.name} orijinal parfüm. Ormivo'dan güvenle sipariş edin.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: p.images?.[0] ? [{ url: p.images[0] }] : [],
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────
export default async function UrunDetayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await getSession();
  const loggedIn = !!session;

  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    include: { category: true, brand: true },
  });
  if (!product) notFound();

  type RelatedProduct = { id: string; slug: string; name: string; price: unknown; comparePrice: unknown; images: string[]; stock: number; brand?: { name: string } | null };

  const related = (await prisma.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    include: { category: true, brand: true },
    take: 4,
    orderBy: { createdAt: "desc" },
  })) as RelatedProduct[];

  const price    = Number(product.price);
  const compare  = product.comparePrice ? Number(product.comparePrice) : null;
  const discount = compare ? Math.round((1 - price / compare) * 100) : null;
  const inStock  = product.stock > 0;

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">

        {/* Breadcrumb */}
        <nav className="flex items-center flex-wrap gap-2 font-sans text-xs text-[#9A9A9A] mb-10">
          <Link href="/" className="hover:text-[#1A1A1A] transition-colors">Ana Sayfa</Link>
          <span className="text-[#D4C8BC]">›</span>
          <Link href="/urunler" className="hover:text-[#1A1A1A] transition-colors">Ürünler</Link>
          {product.brand && (
            <>
              <span className="text-[#D4C8BC]">›</span>
              <Link
                href={`/urunler?marka=${product.brand.slug}`}
                className="hover:text-[#1A1A1A] transition-colors"
              >
                {product.brand.name}
              </Link>
            </>
          )}
          <span className="text-[#D4C8BC]">›</span>
          <span className="text-[#1A1A1A] truncate max-w-[180px]">{product.name}</span>
        </nav>

        {/* ══════════════════════════════════════
            1. ANA BÖLÜM — 2 KOLON
        ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 mb-16">

          {/* Sol: Galeri */}
          <ProductGallery images={product.images ?? []} name={product.name} />

          {/* Sağ: Ürün bilgisi */}
          <div className="flex flex-col">

            {/* Kategori */}
            {product.category && (
              <Link
                href={`/urunler?kategori=${product.category.slug}`}
                className="font-sans text-[10px] tracking-[0.4em] uppercase text-[#C4A882] hover:text-[#8B6F4E] transition-colors mb-3"
              >
                {product.category.name}
              </Link>
            )}

            {/* Marka */}
            {product.brand && (
              <Link href={`/urunler?marka=${product.brand.slug}`} className="block mb-4 group">
                {product.brand.logo ? (
                  <div className="relative h-8 w-28">
                    <Image
                      src={product.brand.logo}
                      alt={product.brand.name}
                      fill
                      className="object-contain object-left"
                    />
                  </div>
                ) : (
                  <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-[#9A9A9A] group-hover:text-[#C4A882] transition-colors">
                    {product.brand.name}
                  </span>
                )}
              </Link>
            )}

            {/* Ürün adı */}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-[42px] font-light text-[#1A1A1A] leading-tight mb-6">
              {product.name}
            </h1>

            {/* Fiyat */}
            <div className="flex items-baseline gap-4 mb-3">
              <span className="font-serif text-3xl text-[#1A1A1A]">
                {price.toLocaleString("tr-TR")} ₺
              </span>
              {compare && (
                <span className="font-sans text-lg text-[#C4A882] line-through">
                  {compare.toLocaleString("tr-TR")} ₺
                </span>
              )}
              {discount && (
                <span className="font-sans text-xs bg-[#F5F0EA] text-[#8B6F4E] border border-[#E8E4DE] px-2.5 py-1 tracking-wide">
                  %{discount} indirim
                </span>
              )}
            </div>

            {/* Stok */}
            <p className="flex items-center gap-2 font-sans text-xs mb-7">
              <span className="w-2 h-2 rounded-full shrink-0 bg-green-500" />
              <span className="text-green-700">Sipariş Alınıyor</span>
            </p>

            {/* Ayraç */}
            <div className="w-12 h-[1px] bg-[#C4A882] mb-7" />

            {/* Kısa açıklama */}
            {product.description && (
              <p className="font-sans text-sm text-[#6B6B6B] leading-relaxed mb-7 line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Adet + Sepete Ekle */}
            <div className="mb-8">
              <ProductAddToCart productId={product.id} loggedIn={loggedIn} inStock={inStock} />
            </div>

            {/* Alt bilgi çubukları */}
            <div className="grid grid-cols-3 gap-3 border-t border-[#E8E4DE] pt-7">
              {[
                { icon: "🚚", label: "2-3 İş Gününde Kargo" },
                { icon: "📦", label: "Özel Ambalaj" },
                { icon: "✓",  label: "İthal Ürün" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-lg">{icon}</span>
                  <span className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#9A9A9A] leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>


          </div>
        </div>

        {/* ══════════════════════════════════════
            2. DETAY SEKMELERİ
        ══════════════════════════════════════ */}
        <ProductTabs description={product.description} scentNotes={product.scentNotes} />

        {/* ══════════════════════════════════════
            3. BENZERİ ÜRÜNLER
        ══════════════════════════════════════ */}
        {related.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#E8E4DE]">
            <div className="text-center mb-10">
              <p className="font-sans text-[10px] tracking-[0.5em] text-[#C4A882] uppercase mb-3">Sizin İçin Seçtik</p>
              <h2 className="font-serif text-3xl font-light text-[#1A1A1A]">Bunları da Beğenebilirsiniz</h2>
            </div>

            {/* Yatay scroll (mobile) / grid (desktop) */}
            <div className="flex gap-4 overflow-x-auto pb-4 md:overflow-x-visible md:grid md:grid-cols-4 md:gap-5 scrollbar-hide">
              {related.map((r) => {
                const rPrice   = Number(r.price);
                const rCompare = r.comparePrice ? Number(r.comparePrice) : null;
                const rImg     = r.images?.[0] ?? null;
                return (
                  <article
                    key={r.id}
                    className="group bg-white border border-[#E8E4DE] hover:border-[#C4A882] hover:shadow-lg transition-all duration-300 flex flex-col shrink-0 w-48 md:w-auto"
                  >
                    <div className="relative overflow-hidden bg-[#F5F0EA]" style={{ aspectRatio: "4/5" }}>
                      <Link href={`/urunler/${r.slug}`} className="absolute inset-0" aria-label={r.name} />
                      {rImg ? (
                        <Image src={rImg} alt={r.name} fill
                          sizes="(max-width:768px) 192px, 25vw"
                          className="object-contain p-4 group-hover:scale-[1.03] transition-transform duration-500 pointer-events-none" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="font-serif text-4xl text-[#C4A882] opacity-20">◈</span>
                        </div>
                      )}
                      <AddToCartButton productId={r.id} loggedIn={loggedIn} />
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      {r.brand?.name && (
                        <p className="font-sans text-[8px] tracking-[0.2em] text-[#C4A882] uppercase mb-1">{r.brand.name}</p>
                      )}
                      <Link href={`/urunler/${r.slug}`}>
                        <h3 className="font-serif text-sm leading-snug text-[#1A1A1A] hover:text-[#C4A882] transition-colors line-clamp-2 mb-2">
                          {r.name}
                        </h3>
                      </Link>
                      <div className="flex items-baseline gap-1.5 mt-auto">
                        <span className="font-sans text-sm font-medium text-[#1A1A1A]">
                          {rPrice.toLocaleString("tr-TR")} ₺
                        </span>
                        {rCompare && (
                          <span className="font-sans text-xs text-[#C4A882] line-through">
                            {rCompare.toLocaleString("tr-TR")} ₺
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
