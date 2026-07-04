"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link  from "next/link";
import AddToCartButton  from "./AddToCartButton";
import FavoriteButton   from "./FavoriteButton";
import { calcDisplayPrice, type SegmentPricingSettings } from "@/lib/segment";

interface Product {
  id:           string;
  slug:         string;
  name:         string;
  price:        number;
  comparePrice: number | null;
  costPrice?:   number | null;
  images:       string[];
  stock:        number;
  brand:        { name: string; slug: string } | null;
  categoryName?: string | null;
}

interface Props {
  initialProducts: Product[];
  total:           number;
  loggedIn:        boolean;
  favoritedIds?:   string[];
  userSegment?:    string | null;
  isB2B?:          boolean;
  b2bMarkup?:      number | null;
  segmentSettings?: SegmentPricingSettings;
  filters: {
    kategori: string;
    marka:    string;
    q:        string;
    sirala:   string;
  };
}

export default function ProductGrid({ initialProducts, total, loggedIn, favoritedIds = [], userSegment, isB2B = false, b2bMarkup = null, segmentSettings, filters }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading,  setLoading]  = useState(false);
  const [hasMore,  setHasMore]  = useState(initialProducts.length < total);
  const [error,    setError]    = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const pageSize = useRef(15);

  useEffect(() => {
    pageSize.current = window.innerWidth < 768 ? 10 : 15;
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        kategori: filters.kategori,
        marka:    filters.marka,
        q:        filters.q,
        sirala:   filters.sirala,
        offset:   String(products.length),
        limit:    String(pageSize.current),
      });
      const res  = await fetch(`/api/products/page?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as { items: Product[]; hasMore: boolean };
      setProducts((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, products.length, filters]);

  /* IntersectionObserver — otomatik yükleme */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="font-serif text-5xl text-[#C4A882] opacity-20 mb-5">◈</p>
        <h2 className="font-serif text-xl text-[#1A1A1A] mb-2">Sonuç bulunamadı</h2>
        <p className="font-sans text-sm text-[#9A9A9A] mb-6">Filtreleri değiştirerek tekrar deneyin.</p>
        <a href="/" className="font-sans text-[11px] tracking-[0.25em] uppercase border border-[#1A1A1A] px-6 py-2.5 hover:bg-[#1A1A1A] hover:text-white transition-colors">
          Sıfırla
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
        {products.map((product) => {
          const price    = product.price;
          const img      = product.images?.[0] ?? null;
          const inStock  = product.stock > 0;

          return (
            <article
              key={product.id}
              className="group bg-white border border-[#E8E4DE] hover:border-[#C4A882] hover:shadow-sm transition-all duration-200 flex flex-col"
            >
              <div className="relative overflow-hidden bg-[#F7F4F0]" style={{ aspectRatio: "3/4" }}>
                <Link href={`/urunler/${product.slug}`} className="absolute inset-0" aria-label={product.name} />
                {img ? (
                  <Image
                    src={img}
                    alt={product.name}
                    fill
                    sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
                    className="object-contain p-3 group-hover:scale-[1.03] transition-transform duration-300 ease-out pointer-events-none"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-serif text-3xl text-[#C4A882] opacity-20 pointer-events-none">◈</span>
                )}
                {!inStock && (
                  <span className="absolute top-2 right-2 bg-[#1A1A1A]/70 text-white font-sans text-[10px] tracking-widest uppercase px-2.5 py-1 pointer-events-none font-semibold shadow-sm">
                    Tükendi
                  </span>
                )}
                <FavoriteButton
                  productId={product.id}
                  loggedIn={loggedIn}
                  initialFavorited={favoritedIds.includes(product.id)}
                />
                <AddToCartButton productId={product.id} loggedIn={loggedIn} />
              </div>

              <div className="p-2 md:p-2.5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  {product.brand ? (
                    <Link href={`/urunler?marka=${product.brand.slug}`} onClick={(e) => e.stopPropagation()}
                      className="font-sans text-[7px] tracking-[0.2em] text-[#C4A882] hover:text-[#8B6F4E] truncate transition-colors">
                      {product.brand.name}
                    </Link>
                  ) : <span />}
                  {product.categoryName && (
                    <span className="font-sans text-[7px] tracking-[0.15em] text-[#9A9A9A] truncate ml-1 shrink-0">
                      {product.categoryName}
                    </span>
                  )}
                </div>
                <Link href={`/urunler/${product.slug}`} className="block">
                  <h3 className="font-sans text-[11px] md:text-xs leading-snug text-[#1A1A1A] hover:text-[#C4A882] transition-colors line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-between gap-1 mt-auto">
                  {(() => {
                    if (!loggedIn) {
                      return (
                        <a href="/giris" className="font-sans text-[10px] text-[#C4A882] hover:underline">
                          Fiyat için giriş yapın →
                        </a>
                      );
                    }
                    const { displayPrice, originalPrice, label, labelColor } = calcDisplayPrice(
                      price, product.costPrice, isB2B, b2bMarkup, userSegment, segmentSettings
                    );
                    return label ? (
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className={`font-sans text-[8px] px-1 py-px rounded font-semibold self-start ${labelColor}`}>
                          {label}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-sans text-xs font-semibold text-[#C4A882]">{displayPrice.toLocaleString("tr-TR")} ₺</span>
                          {originalPrice && <span className="font-sans text-[10px] text-[#9A9A9A] line-through">{originalPrice.toLocaleString("tr-TR")} ₺</span>}
                        </div>
                      </div>
                    ) : (
                      <p className="font-sans text-xs md:text-sm font-semibold text-[#1A1A1A]">
                        {displayPrice.toLocaleString("tr-TR")} ₺
                      </p>
                    );
                  })()}
                  {inStock && (
                    <span className="md:hidden">
                      <AddToCartButton productId={product.id} loggedIn={loggedIn} mini />
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Sentinel — IntersectionObserver buraya bakar */}
      {hasMore && !error && (
        <div ref={sentinelRef} className="h-8" />
      )}

      {/* Yüklenme göstergesi */}
      {loading && (
        <div className="py-8 flex justify-center">
          <span className="font-serif text-2xl text-[#C4A882] opacity-40 animate-pulse">◈</span>
        </div>
      )}

      {/* Hata + fallback buton */}
      {error && (
        <div className="py-8 flex flex-col items-center gap-3">
          <p className="font-sans text-xs text-[#9A9A9A]">Yüklenemedi.</p>
          <button
            onClick={loadMore}
            className="font-sans text-[11px] tracking-[0.25em] uppercase border border-[#1A1A1A] px-6 py-2.5 hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            Diğer Ürünler
          </button>
        </div>
      )}

      {/* Manuel buton — scroll çalışmadığında yedek */}
      {hasMore && !loading && !error && (
        <div className="py-6 flex justify-center">
          <button
            onClick={loadMore}
            className="font-sans text-[11px] tracking-[0.25em] uppercase border border-[#E8E4DE] text-[#9A9A9A] px-6 py-2 hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
          >
            Diğer Ürünler ({total - products.length} ürün)
          </button>
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <p className="py-6 text-center font-sans text-[10px] tracking-[0.2em] uppercase text-[#C8C4BE]">
          Tüm {total} ürün gösterildi
        </p>
      )}
    </>
  );
}
