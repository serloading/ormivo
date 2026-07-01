import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ProductGallery from "@/components/site/ProductGallery";
import { getSegmentPrice, SEGMENT_LABELS, SEGMENT_COLORS } from "@/lib/segment";
import { getSegmentSettings } from "@/lib/actions/settings";
import ProductTabs from "@/components/site/ProductTabs";
import ProductAddToCart from "@/components/site/ProductAddToCart";
import AddToCartButton from "@/components/site/AddToCartButton";
import FomoIndicators from "@/components/site/FomoIndicators";

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

  const session     = await getSession();
  const loggedIn    = !!session;
  const userSegment = session?.segment ?? null;
  const isB2B       = session?.isB2BApproved ?? false;
  const segmentSettings = await getSegmentSettings();

  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, isActive: true, isTester: false },
    include: { category: true, brand: true },
  });
  if (!product) notFound();

  type RelatedProduct = { id: string; slug: string; name: string; price: unknown; comparePrice: unknown; images: string[]; stock: number; brand?: { name: string; slug: string } | null };

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

  const price = Number(product.price);
  const costPrice = product.costPrice != null ? Number(product.costPrice) : null;
  const segPrice = getSegmentPrice(price, userSegment, segmentSettings, costPrice);
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
          <ProductGallery images={product.images ?? []} name={product.name} showDiscountBadge={!!segPrice} isBestSeller={product.isBestSeller} />

          {/* Sağ: Ürün bilgisi */}
          <div className="flex flex-col">

            {/* Kategori */}
            {product.category && (
              <Link
                href={`/urunler?kategori=${product.category.slug}`}
                className="font-sans text-[10px] tracking-[0.4em] text-[#C4A882] hover:text-[#8B6F4E] transition-colors mb-3 block"
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
                  <span className="font-sans text-[11px] tracking-[0.35em] text-[#9A9A9A] group-hover:text-[#C4A882] transition-colors">
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
            {(() => {
              if (!loggedIn) {
                return (
                  <div className="mb-3">
                    <Link href="/giris" className="font-sans text-sm text-[#C4A882] hover:underline">
                      Fiyat için giriş yapın →
                    </Link>
                  </div>
                );
              }
              const b2bPrice = product.b2bPrice != null ? Number(product.b2bPrice) : null;
              if (isB2B && b2bPrice) {
                return (
                  <div className="mb-3 space-y-1.5">
                    <span className="inline-block font-sans text-[11px] px-2.5 py-1 rounded font-semibold bg-[#1A1A1A] text-[#C4A882]">
                      Bayi Fiyatı
                    </span>
                    <div className="flex items-baseline gap-4">
                      <span className="font-serif text-3xl text-[#C4A882] font-medium">
                        {b2bPrice.toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                  </div>
                );
              }
              const segPrice = getSegmentPrice(price, userSegment, segmentSettings, costPrice);
              return segPrice ? (
                <div className="mb-3 space-y-1.5">
                  <span className={`inline-block font-sans text-[11px] px-2.5 py-1 rounded font-semibold ${SEGMENT_COLORS[userSegment!]}`}>
                    {SEGMENT_LABELS[userSegment!]} Fiyatı
                  </span>
                  <div className="flex items-baseline gap-4">
                    <span className="font-serif text-3xl text-[#C4A882] font-medium">
                      {segPrice.toLocaleString("tr-TR")} ₺
                    </span>
                    <span className="font-sans text-lg text-[#9A9A9A] line-through">
                      {price.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-4 mb-3">
                  <span className="font-serif text-3xl text-[#1A1A1A]">
                    {price.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              );
            })()}

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

            {/* FOMO göstergeleri */}
            <FomoIndicators />

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
                        <Link href={`/urunler?marka=${r.brand.slug}`}
                          className="font-sans text-[8px] tracking-[0.2em] text-[#C4A882] hover:text-[#8B6F4E] mb-1 block transition-colors">
                          {r.brand.name}
                        </Link>
                      )}
                      <Link href={`/urunler/${r.slug}`}>
                        <h3 className="font-serif text-sm leading-snug text-[#1A1A1A] hover:text-[#C4A882] transition-colors line-clamp-2 mb-2">
                          {r.name}
                        </h3>
                      </Link>
                      <div className="mt-auto">
                        {(() => {
                          if (!loggedIn) {
                            return (
                              <Link href="/giris" className="font-sans text-xs text-[#C4A882] hover:underline">
                                Fiyat için giriş yapın →
                              </Link>
                            );
                          }
                          const rB2bPrice = (r as { b2bPrice?: unknown }).b2bPrice != null ? Number((r as { b2bPrice?: unknown }).b2bPrice) : null;
                          if (isB2B && rB2bPrice) {
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-sans text-[8px] px-1 py-px rounded font-semibold self-start bg-[#1A1A1A] text-[#C4A882]">Bayi</span>
                                <span className="font-sans text-sm font-semibold text-[#1A1A1A]">{rB2bPrice.toLocaleString("tr-TR")} ₺</span>
                              </div>
                            );
                          }
              const rCostPrice = (r as { costPrice?: unknown }).costPrice != null ? Number((r as { costPrice?: unknown }).costPrice) : null;
              const rSeg = getSegmentPrice(rPrice, userSegment, segmentSettings, rCostPrice);
                          return rSeg ? (
                            <div className="flex flex-col gap-0.5">
                              <span className={`font-sans text-[8px] px-1 py-px rounded font-semibold self-start ${SEGMENT_COLORS[userSegment!]}`}>
                                {SEGMENT_LABELS[userSegment!]}
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className="font-sans text-sm font-semibold text-[#C4A882]">{rSeg.toLocaleString("tr-TR")} ₺</span>
                                <span className="font-sans text-xs text-[#9A9A9A] line-through">{rPrice.toLocaleString("tr-TR")} ₺</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-sans text-sm font-medium text-[#1A1A1A]">{rPrice.toLocaleString("tr-TR")} ₺</span>
                            </div>
                          );
                        })()}
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
