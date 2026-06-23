import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import AddToCartButton from "@/components/site/AddToCartButton";
import UrunlerMobileFilter from "@/components/site/UrunlerMobileFilter";

export const metadata = { title: "Koleksiyon — Ormivo" };
export const dynamic = "force-dynamic";

const SIRALA_OPTIONS = [
  { value: "fiyat-artan",  label: "Fiyat: Artan" },
  { value: "fiyat-azalan", label: "Fiyat: Azalan" },
];

const CAT_HEADINGS: Record<string, string> = {
  kadin:            "Kadın Parfümleri",
  erkek:            "Erkek Parfümleri",
  unisex:           "Unisex Parfümler",
  "ozel-koleksiyon":"Özel Koleksiyon",
};

function buildHref(current: { kategori: string; marka: string; sirala: string }, key: string, value: string) {
  const next = { ...current, [key]: value };
  const p = new URLSearchParams();
  if (next.kategori) p.set("kategori", next.kategori);
  if (next.marka)    p.set("marka",    next.marka);
  if (next.sirala) p.set("sirala", next.sirala);
  return `/urunler${p.toString() ? `?${p}` : ""}`;
}

export default async function UrunlerPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; marka?: string; sirala?: string }>;
}) {
  const sp      = await searchParams;
  const kategori = sp.kategori ?? "";
  const marka    = sp.marka    ?? "";
  const sirala   = sp.sirala   ?? "";

  const isOzelFilter = kategori === "ozel-koleksiyon";
  const where = {
    deletedAt: null,
    isActive: true,
    ...(isOzelFilter              ? { isOzelKoleksiyon: true }           : {}),
    ...(kategori && !isOzelFilter ? { category: { slug: kategori } }     : {}),
    ...(marka                     ? { brand:    { slug: marka    } }     : {}),
  };

  const orderBy =
    sirala === "fiyat-artan"  ? { price: "asc"  as const } :
    sirala === "fiyat-azalan" ? { price: "desc" as const } :
                                { createdAt:  "asc" as const };

  const session = await getSession();
  const loggedIn = !!session;

  const [rawProducts, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  type UrunCat   = { id: string; name: string; slug: string };
  type UrunBrand = { id: string; name: string; slug: string };
  type UrunProduct = { id: string; slug: string; name: string; price: unknown; comparePrice: unknown; images: string[]; stock: number; brand?: { name: string } | null; category?: { name: string } | null };

  const typedCats    = categories as UrunCat[];
  const typedBrands  = brands     as UrunBrand[];

  // Fiyat sıralaması seçilmediyse rastgele karıştır
  const products = ((sirala === "fiyat-artan" || sirala === "fiyat-azalan")
    ? rawProducts
    : [...rawProducts].sort(() => Math.random() - 0.5)) as UrunProduct[];

  const activeCat   = typedCats.find((c) => c.slug === kategori);
  const activeBrand = typedBrands.find((b) => b.slug === marka);
  const heading = kategori
    ? (CAT_HEADINGS[kategori] ?? `${activeCat?.name ?? ""} Parfümleri`)
    : marka
      ? `${activeBrand?.name ?? ""} Parfümleri`
      : "Tüm Ürünler";

  const hasFilter = !!(kategori || marka);
  const hrefOf = (k: string, v: string) => buildHref({ kategori, marka, sirala }, k, v);

  return (
    <div className="bg-[#FAFAF7] min-h-screen">

      {/* ══════════════════════════════════
          1. HERO BAŞLIK
      ══════════════════════════════════ */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: "300px", background: "linear-gradient(135deg, #F5F0EA 0%, #EDE5D8 55%, #E4D8C8 100%)" }}
      >
        <span
          className="pointer-events-none select-none absolute right-[-16px] bottom-[-36px] font-serif font-bold leading-none text-[#C4A882]"
          style={{ fontSize: "260px", opacity: 0.07 }}
          aria-hidden
        >
          {activeCat?.name?.[0] ?? activeBrand?.name?.[0] ?? "O"}
        </span>
        <span className="absolute top-6 left-6 w-10 h-10 border-t border-l border-[#C4A882]/30 pointer-events-none" />
        <span className="absolute bottom-6 right-6 w-10 h-10 border-b border-r border-[#C4A882]/30 pointer-events-none" />

        <div className="relative z-10">
          <p className="font-sans text-[10px] tracking-[0.55em] text-[#C4A882] uppercase mb-5">Koleksiyon</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-[#1A1A1A] mb-6">{heading}</h1>
          <nav className="flex items-center justify-center flex-wrap gap-2 font-sans text-xs text-[#9A9A9A]">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors">Ana Sayfa</Link>
            <span className="text-[#D4C8BC]">›</span>
            <Link href="/urunler" className={!hasFilter ? "text-[#1A1A1A]" : "hover:text-[#1A1A1A] transition-colors"}>Ürünler</Link>
            {activeCat && <><span className="text-[#D4C8BC]">›</span><span className="text-[#1A1A1A]">{activeCat.name}</span></>}
            {activeBrand && <><span className="text-[#D4C8BC]">›</span><span className="text-[#1A1A1A]">{activeBrand.name}</span></>}
          </nav>
        </div>
      </div>

      {/* ══════════════════════════════════
          2. FİLTRE + GRID
      ══════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* Mobil filtre */}
        <Suspense fallback={null}>
          <UrunlerMobileFilter
            categories={categories}
            brands={brands}
            activeKategori={kategori || "tumu"}
            activeMarka={marka || "tumu"}
            activeSirala={sirala}
          />
        </Suspense>

        <div className="flex gap-10 lg:gap-14 items-start">

          {/* ── Desktop Sidebar ── */}
          <aside className="hidden md:flex flex-col gap-8 w-[220px] shrink-0 sticky top-24">

            {/* Kategoriler */}
            <div>
              <p className="font-sans text-[9px] tracking-[0.45em] text-[#C4A882] uppercase mb-4 pb-3 border-b border-[#E8E4DE]">Kategoriler</p>
              <nav className="space-y-0.5">
                <a href={hrefOf("kategori", "")}
                  className={`flex items-center justify-between py-2 px-1 font-sans text-sm transition-colors ${!kategori ? "text-[#C4A882] font-semibold" : "text-[#6B6B6B] hover:text-[#1A1A1A]"}`}>
                  Tümü {!kategori && <span className="w-1.5 h-1.5 rounded-full bg-[#C4A882] shrink-0" />}
                </a>
                {typedCats.map((cat) => (
                  <a key={cat.slug} href={hrefOf("kategori", cat.slug)}
                    className={`flex items-center justify-between py-2 px-1 font-sans text-sm transition-colors ${kategori === cat.slug ? "text-[#C4A882] font-semibold" : "text-[#6B6B6B] hover:text-[#1A1A1A]"}`}>
                    {cat.name}
                    {kategori === cat.slug && <span className="w-1.5 h-1.5 rounded-full bg-[#C4A882] shrink-0" />}
                  </a>
                ))}
              </nav>
            </div>

            {/* Markalar */}
            <div>
              <p className="font-sans text-[9px] tracking-[0.45em] text-[#C4A882] uppercase mb-4 pb-3 border-b border-[#E8E4DE]">Markalar</p>
              <nav className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
                <a href={hrefOf("marka", "")}
                  className={`flex items-center justify-between py-2 px-1 font-sans text-sm transition-colors ${!marka ? "text-[#C4A882] font-semibold" : "text-[#6B6B6B] hover:text-[#1A1A1A]"}`}>
                  Tümü {!marka && <span className="w-1.5 h-1.5 rounded-full bg-[#C4A882] shrink-0" />}
                </a>
                {typedBrands.map((b) => (
                  <a key={b.slug} href={hrefOf("marka", b.slug)}
                    className={`flex items-center justify-between py-2 px-1 font-sans text-sm transition-colors ${marka === b.slug ? "text-[#C4A882] font-semibold" : "text-[#6B6B6B] hover:text-[#1A1A1A]"}`}>
                    {b.name}
                    {marka === b.slug && <span className="w-1.5 h-1.5 rounded-full bg-[#C4A882] shrink-0" />}
                  </a>
                ))}
              </nav>
            </div>

            {/* Sıralama */}
            <div>
              <p className="font-sans text-[9px] tracking-[0.45em] text-[#C4A882] uppercase mb-4 pb-3 border-b border-[#E8E4DE]">Sıralama</p>
              <div className="space-y-0.5">
                {SIRALA_OPTIONS.map((opt) => {
                  const active = sirala === opt.value;
                  return (
                    <a key={opt.value} href={hrefOf("sirala", opt.value)}
                      className={`flex items-center gap-3 py-2 px-1 font-sans text-sm transition-colors ${active ? "text-[#C4A882] font-semibold" : "text-[#6B6B6B] hover:text-[#1A1A1A]"}`}>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${active ? "border-[#C4A882]" : "border-[#D4C8BC]"}`}>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-[#C4A882]" />}
                      </span>
                      {opt.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── Ürün Grid ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="font-sans text-xs text-[#9A9A9A]">
                <span className="font-medium text-[#1A1A1A]">{products.length}</span> ürün listeleniyor
              </p>
              {hasFilter && (
                <Link href="/urunler"
                  className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#C4A882] hover:text-[#8B6F4E] border-b border-[#C4A882]/40 pb-0.5 transition-colors">
                  Filtreyi Temizle ×
                </Link>
              )}
            </div>

            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center border border-dashed border-[#E8E4DE] rounded">
                <span className="font-serif text-7xl text-[#C4A882] opacity-20 mb-6 leading-none">◈</span>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-3">Ürün Bulunamadı</h3>
                <p className="font-sans text-sm text-[#9A9A9A] max-w-xs mb-8 leading-relaxed">
                  Bu filtrede ürün bulunmuyor. Diğer koleksiyonlarımıza göz atabilirsiniz.
                </p>
                <Link href="/urunler"
                  className="font-sans text-[11px] tracking-[0.3em] uppercase border border-[#1A1A1A] text-[#1A1A1A] px-8 py-3 hover:bg-[#1A1A1A] hover:text-white transition-colors duration-300">
                  Tüm Ürünleri Gör
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {products.map((product) => {
                  const price    = Number(product.price);
                  const compare  = product.comparePrice ? Number(product.comparePrice) : null;
                  const discount = compare ? Math.round((1 - price / compare) * 100) : null;
                  const img      = product.images?.[0] ?? null;
                  const inStock  = product.stock > 0;
                  return (
                    <article key={product.id}
                      className="group bg-white border border-[#E8E4DE] hover:border-[#C4A882] hover:shadow-lg transition-all duration-300 flex flex-col">
                      <div className="relative overflow-hidden bg-[#F5F0EA]" style={{ aspectRatio: "4/5" }}>
                        <Link href={`/urunler/${product.slug}`} className="absolute inset-0" aria-label={product.name} />
                        {img ? (
                          <Image src={img} alt={product.name} fill
                            sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 25vw"
                            className="object-contain p-4 md:p-6 group-hover:scale-[1.03] transition-transform duration-500 ease-out pointer-events-none" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="font-serif text-5xl text-[#C4A882] opacity-20">◈</span>
                          </div>
                        )}
                        {!inStock && (
                          <div className="absolute top-2 right-2 bg-[#1A1A1A]/80 text-white font-sans text-[8px] tracking-[0.18em] uppercase px-2 py-1 pointer-events-none">Tükendi</div>
                        )}
                        {discount && inStock && (
                          <div className="absolute top-2 left-2 bg-[#C4A882] text-white font-sans text-[8px] tracking-[0.1em] uppercase px-2 py-1 pointer-events-none">-%{discount}</div>
                        )}
                        <AddToCartButton productId={product.id} loggedIn={loggedIn} />
                      </div>

                      <div className="p-3 md:p-4 flex flex-col flex-1">
                        {product.brand?.name && (
                          <p className="font-sans text-[8px] md:text-[9px] tracking-[0.22em] text-[#C4A882] uppercase mb-1">{product.brand.name}</p>
                        )}
                        <Link href={`/urunler/${product.slug}`}>
                          <h3 className="font-serif text-sm md:text-[15px] leading-snug text-[#1A1A1A] hover:text-[#C4A882] transition-colors line-clamp-2 mb-1.5">{product.name}</h3>
                        </Link>
                        {product.category && (
                          <p className="font-sans text-[8px] tracking-[0.12em] text-[#B0B0B0] uppercase mb-2.5">{product.category.name}</p>
                        )}
                        <div className="flex items-baseline gap-1.5 mt-auto">
                          <span className="font-sans text-sm font-medium text-[#1A1A1A]">{price.toLocaleString("tr-TR")} ₺</span>
                          {compare && <span className="font-sans text-xs text-[#C4A882] line-through">{compare.toLocaleString("tr-TR")} ₺</span>}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
