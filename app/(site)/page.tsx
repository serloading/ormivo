import { prisma }         from "@/lib/prisma";
import { getSession }     from "@/lib/session";
import HomeFilterClient   from "@/components/site/HomeFilterClient";
import MarqueeBanner      from "@/components/site/MarqueeBanner";
import ProductGrid        from "@/components/site/ProductGrid";
import CollapsibleList    from "@/components/site/CollapsibleList";
import Image              from "next/image";
import Link               from "next/link";
import AddToCartButton    from "@/components/site/AddToCartButton";
import FavoriteButton    from "@/components/site/FavoriteButton";
import { getUserFavoriteIds } from "@/lib/actions/favorite";
import { calcDisplayPrice, SEGMENT_LABELS, SEGMENT_COLORS } from "@/lib/segment";
import { getSegmentSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ormivo — Parfüm Kataloğu" };

const INITIAL_LIMIT = 15;

// En çok satan 10 ürün hesapla (her iki sipariş tablosundan)
async function getTopSellers(limit = 10) {
  const [siteOrders, manuelOrders] = await Promise.all([
    prisma.siteOrder.findMany({ select: { items: true }, where: { paymentStatus: { in: ["PAID", "FREE"] } } }),
    prisma.order.findMany({ select: { items: true }, where: { paymentStatus: { in: ["PAID", "FREE"] } } }),
  ]);

  const countMap = new Map<string, number>();

  for (const o of siteOrders) {
    const items = o.items as { productId?: string; qty?: number; quantity?: number }[];
    for (const item of items) {
      if (!item.productId) continue;
      countMap.set(item.productId, (countMap.get(item.productId) ?? 0) + (item.qty ?? item.quantity ?? 1));
    }
  }
  for (const o of manuelOrders) {
    const items = o.items as { productId?: string; qty?: number; quantity?: number }[];
    for (const item of items) {
      if (!item.productId) continue;
      countMap.set(item.productId, (countMap.get(item.productId) ?? 0) + (item.qty ?? item.quantity ?? 1));
    }
  }

  const sorted = [...countMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const ids    = sorted.map(([id]) => id);
  if (!ids.length) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true, deletedAt: null },
    include: { brand: true },
  });

  // Orijinal sırayı koru
  return ids
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as typeof products;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; marka?: string; sirala?: string; q?: string }>;
}) {
  const sp       = await searchParams;
  const kategori = sp.kategori ?? "";
  const marka    = sp.marka    ?? "";
  const sirala   = sp.sirala   ?? "";
  const q        = sp.q        ?? "";

  const where = {
    deletedAt: null,
    isActive:  true,
    ...(kategori ? { category: { slug: kategori } } : {}),
    ...(marka    ? { brand:    { slug: marka    } } : {}),
    ...(q        ? { name:     { contains: q, mode: "insensitive" as const } } : {}),
  };

  const session    = await getSession();
  const loggedIn   = !!session;
  const userSegment = session?.segment ?? null;
  const isB2B       = session?.isB2BApproved ?? false;
  const b2bMarkup   = session?.b2bMarkup ?? null;

  const [rawProducts, categories, brands, topSellers, favoritedIds, segmentSettings] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy:
        sirala === "fiyat-artan"  ? { price: "asc"     } :
        sirala === "fiyat-azalan" ? { price: "desc"    } :
                                    { createdAt: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    // Sadece filtre yokken en çok satanları getir (ana sayfa görünümü)
    (kategori || marka || q || sirala) ? Promise.resolve([]) : getTopSellers(10),
    getUserFavoriteIds(),
    getSegmentSettings(),
  ]);

  type RawProduct = { id: string; slug: string; name: string; price: unknown; comparePrice: unknown; costPrice: unknown; images: string[]; stock: number; brand: { name: string; slug: string } | null; category: { name: string } | null };
  type RawCategory = { id: string; name: string; slug: string };
  type RawBrand = { id: string; name: string; slug: string };

  const allProducts = ((sirala === "fiyat-artan" || sirala === "fiyat-azalan")
    ? rawProducts
    : seededShuffle(rawProducts)) as RawProduct[];

  const initialProducts = allProducts.slice(0, INITIAL_LIMIT).map((p) => ({
    id:           p.id,
    slug:         p.slug,
    name:         p.name,
    price:        Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    costPrice:    p.costPrice != null ? Number(p.costPrice) : null,
    images:       p.images as string[],
    stock:        p.stock,
    brand:        p.brand ? { name: p.brand.name, slug: p.brand.slug } : null,
    categoryName: p.category?.name ?? null,
  }));

  /* ── Sidebar link builder ── */
  const href = (key: string, value: string) => buildHref({ kategori, marka, sirala, q }, key, value);

  const sortedCategories = [...(categories as RawCategory[])].sort((a, b) => {
    if (a.slug === "unisex") return 1;
    if (b.slug === "unisex") return -1;
    return a.name.localeCompare(b.name, "tr");
  });

  const categoryItems = [
    { href: href("kategori", ""), active: !kategori, label: "Tümü" },
    ...sortedCategories.filter((c) => c.slug !== "ozel-koleksiyon").map((c) => ({ href: href("kategori", c.slug), active: kategori === c.slug, label: c.name })),
  ];

  const brandItems = [
    { href: href("marka", ""), active: !marka, label: "Tüm Markalar" },
    ...(brands as RawBrand[]).map((b) => ({ href: href("marka", b.slug), active: marka === b.slug, label: b.name })),
  ];

  const sortItems = [
    { href: href("sirala", ""),              active: !sirala,                   label: "Rastgele"     },
    { href: href("sirala", "fiyat-artan"),   active: sirala === "fiyat-artan",  label: "Fiyat: Artan" },
    { href: href("sirala", "fiyat-azalan"),  active: sirala === "fiyat-azalan", label: "Fiyat: Azalan"},
  ];

  // En çok satanlar sidebar linki (her biri doğrudan ürün sayfasına gider)
  const topSellerItems = topSellers.map((p) => ({
    href: `/urunler/${p.slug}`,
    active: false,
    label: p.name,
  }));

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <MarqueeBanner />

      <div className="flex min-h-0">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden md:flex flex-col gap-0 w-56 shrink-0 border-r border-[#E8E4DE] bg-white sticky top-[72px] self-start h-[calc(100vh-72px)] overflow-y-auto">

          {(kategori || marka || sirala || q) && (
            <div className="px-5 pt-5 pb-3 border-b border-[#E8E4DE]">
              <a href="/" className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#C4A882] hover:text-[#8B6F4E] transition-colors">
                × Filtreleri Sıfırla
              </a>
            </div>
          )}

          <div className="px-5 py-5 border-b border-[#E8E4DE]">
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">Kategori</p>
            <CollapsibleList items={categoryItems} initialShow={8} label="kategori" />
          </div>

          <div className="px-5 py-5 border-b border-[#E8E4DE]">
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">Sıralama</p>
            <CollapsibleList items={sortItems} initialShow={3} />
          </div>

          <div className="px-5 py-5 border-b border-[#E8E4DE]">
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">Marka</p>
            <CollapsibleList items={brandItems} initialShow={8} label="marka" />
          </div>

          {topSellerItems.length > 0 && (
            <div className="px-5 py-5">
              <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">En Çok Satanlar</p>
              <div className="space-y-0">
                {topSellerItems.map((item, i) => (
                  <a key={item.href} href={item.href}
                    className="flex items-center gap-2 py-1.5 pl-2 font-sans text-sm text-[#6B6B6B] hover:text-[#C4A882] transition-colors">
                    <span className="text-[10px] text-[#C4A882] font-mono w-4 shrink-0">{i + 1}</span>
                    <span className="truncate">{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── ÜRÜN ALANI ── */}
        <div className="flex-1 min-w-0 p-3 md:p-5">

          <HomeFilterClient
            categories={categories}
            brands={brands}
            activeKategori={kategori}
            activeMarka={marka}
            activeSirala={sirala}
            activeQ={q}
          />

          {/* En Çok Satanlar bölümü (sadece filtre yokken) */}
          {topSellers.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-1">Öne Çıkanlar</p>
                  <h2 className="font-serif text-xl text-[#1A1A1A]">En Çok Satanlar</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {topSellers.map((p) => {
                  const price   = Number(p.price);
                  const img     = p.images?.[0] ?? null;
                  return (
                    <article key={p.id} className="group bg-white border border-[#E8E4DE] hover:border-[#C4A882] hover:shadow-md transition-all duration-300 flex flex-col">
                      <div className="relative overflow-hidden bg-[#F5F0EA]" style={{ aspectRatio: "4/5" }}>
                        <Link href={`/urunler/${p.slug}`} className="absolute inset-0" aria-label={p.name} />
                        {img ? (
                          <Image src={img} alt={p.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
                            className="object-contain p-3 group-hover:scale-[1.03] transition-transform duration-500 pointer-events-none" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="font-serif text-3xl text-[#C4A882] opacity-20">◈</span>
                          </div>
                        )}
                        <span className="absolute top-2 right-2 z-10 bg-[#1A1A1A] text-[#C4A882] font-sans text-[10px] tracking-widest px-2.5 py-1 uppercase font-semibold pointer-events-none shadow-sm">
                          ★ En Çok Satan
                        </span>
                        <FavoriteButton productId={p.id} loggedIn={loggedIn} initialFavorited={favoritedIds.includes(p.id)} />
                        <AddToCartButton productId={p.id} loggedIn={loggedIn} />
                      </div>
                      <div className="p-2.5 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          {p.brand ? (
                            <Link href={`/urunler?marka=${p.brand.slug}`} className="font-sans text-[8px] tracking-[0.2em] text-[#C4A882] hover:text-[#8B6F4E] truncate transition-colors">
                              {p.brand.name}
                            </Link>
                          ) : <span />}
                          {(p as { category?: { name: string } | null }).category?.name && (
                            <span className="font-sans text-[7px] tracking-[0.15em] text-[#9A9A9A] truncate ml-1 shrink-0">
                              {(p as { category?: { name: string } | null }).category!.name}
                            </span>
                          )}
                        </div>
                        <Link href={`/urunler/${p.slug}`}>
                          <h3 className="font-serif text-xs leading-snug text-[#1A1A1A] hover:text-[#C4A882] transition-colors line-clamp-2 mb-1.5">{p.name}</h3>
                        </Link>
                        <div className="flex items-center justify-between gap-1 mt-auto">
                          {(() => {
                            if (!loggedIn) {
                              return (
                                <Link href="/giris" className="font-sans text-[10px] text-[#C4A882] hover:underline">
                                  Fiyat için giriş yapın →
                                </Link>
                              );
                            }
                            const pCostPrice = (p as { costPrice?: unknown }).costPrice != null ? Number((p as { costPrice?: unknown }).costPrice) : null;
                            const { displayPrice, originalPrice, label, labelColor } = calcDisplayPrice(price, pCostPrice, isB2B, b2bMarkup, userSegment, segmentSettings);
                            return label ? (
                              <div className="flex flex-col gap-0.5">
                                <span className={`font-sans text-[9px] px-1.5 py-0.5 rounded font-semibold ${labelColor}`}>
                                  {label}
                                </span>
                                <div className="flex items-baseline gap-1">
                                  <span className="font-sans text-xs font-semibold text-[#C4A882]">{displayPrice.toLocaleString("tr-TR")} ₺</span>
                                  {originalPrice && <span className="font-sans text-[10px] text-[#9A9A9A] line-through">{originalPrice.toLocaleString("tr-TR")} ₺</span>}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-baseline gap-1">
                                <span className="font-sans text-xs font-medium text-[#1A1A1A]">{displayPrice.toLocaleString("tr-TR")} ₺</span>
                              </div>
                            );
                          })()}
                          {p.stock > 0 && (
                            <span className="md:hidden">
                              <AddToCartButton productId={p.id} loggedIn={loggedIn} mini />
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="border-b border-[#E8E4DE] mt-8 mb-2" />
            </section>
          )}

          <ProductGrid
            key={`${kategori}|${marka}|${q}|${sirala}`}
            initialProducts={initialProducts}
            total={allProducts.length}
            loggedIn={loggedIn}
            favoritedIds={favoritedIds}
            userSegment={userSegment}
            isB2B={isB2B}
            b2bMarkup={b2bMarkup}
            segmentSettings={segmentSettings}
            filters={{ kategori, marka, q, sirala }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Günlük seed ile Fisher-Yates shuffle ─── */
function seededShuffle<T>(arr: T[]): T[] {
  const today = new Date();
  let seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildHref(
  state: { kategori: string; marka: string; sirala: string; q: string },
  key: string, value: string,
) {
  const next = { ...state, [key]: value };
  const p = new URLSearchParams();
  if (next.kategori) p.set("kategori", next.kategori);
  if (next.marka)    p.set("marka",    next.marka);
  if (next.sirala)   p.set("sirala",   next.sirala);
  if (next.q)        p.set("q",        next.q);
  return `/${p.toString() ? `?${p}` : ""}`;
}
