import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import HomeFilterClient from "@/components/site/HomeFilterClient";
import AddToCartButton from "@/components/site/AddToCartButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ormivo — Parfüm Kataloğu" };


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

  const session = await getSession();
  const loggedIn = !!session;

  const [rawProducts, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include:  { category: true, brand: true },
      orderBy:
        sirala === "fiyat-artan"  ? { price: "asc"      } :
        sirala === "fiyat-azalan" ? { price: "desc"     } :
                                    { createdAt: "asc"  },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  // Sunucu tarafında deterministik karıştırma (hydration mismatch önlemek için seed kullan)
  const products = (sirala === "fiyat-artan" || sirala === "fiyat-azalan")
    ? rawProducts
    : seededShuffle(rawProducts);

  return (
    <div className="bg-[#FAFAF7] min-h-screen">

      {/* ── Katalog başlık bandı ── */}
      <div className="border-b border-[#E8E4DE] bg-white px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-[#1A1A1A]">Parfüm Kataloğu</h1>
          <p className="font-sans text-xs text-[#9A9A9A] mt-0.5">
            {products.length} ürün
            {kategori && ` · ${categories.find(c=>c.slug===kategori)?.name ?? kategori}`}
            {marka    && ` · ${brands.find(b=>b.slug===marka)?.name ?? marka}`}
            {q        && ` · "${q}"`}
          </p>
        </div>

        {/* Arama kutusu */}
        <form method="GET" action="/" className="flex items-center border border-[#E8E4DE] bg-[#FAFAF7] px-3 py-2 gap-2 w-full md:w-64">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#C4A882] shrink-0">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {kategori && <input type="hidden" name="kategori" value={kategori} />}
          {marka    && <input type="hidden" name="marka"    value={marka} />}
          {sirala   && <input type="hidden" name="sirala"   value={sirala} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Marka veya parfüm ara..."
            className="flex-1 bg-transparent font-sans text-sm text-[#1A1A1A] placeholder-[#C8C4BE] outline-none"
          />
        </form>
      </div>

      <div className="flex min-h-0">

        {/* ═══════════════════════════════════════
            DESKTOP SIDEBAR
        ═══════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col gap-0 w-56 shrink-0 border-r border-[#E8E4DE] bg-white sticky top-[72px] self-start h-[calc(100vh-72px)] overflow-y-auto">

          {/* Sıfırla */}
          {(kategori || marka || sirala || q) && (
            <div className="px-5 pt-5 pb-3 border-b border-[#E8E4DE]">
              <a href="/" className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#C4A882] hover:text-[#8B6F4E] transition-colors">
                × Filtreleri Sıfırla
              </a>
            </div>
          )}

          {/* Kategori */}
          <div className="px-5 py-5 border-b border-[#E8E4DE]">
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">Kategori</p>
            <nav className="space-y-0">
              <SidebarLink
                href={buildHref({ kategori: "", marka, sirala, q }, "kategori", "")}
                active={!kategori}
                label="Tümü"
              />
              {categories.map((cat) => (
                <SidebarLink
                  key={cat.slug}
                  href={buildHref({ kategori, marka, sirala, q }, "kategori", cat.slug)}
                  active={kategori === cat.slug}
                  label={cat.name}
                />
              ))}
            </nav>
          </div>

          {/* Sıralama */}
          <div className="px-5 py-5 border-b border-[#E8E4DE]">
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">Sıralama</p>
            <nav className="space-y-0">
              <SidebarLink
                href={buildHref({ kategori, marka, sirala: "", q }, "sirala", "")}
                active={!sirala}
                label="Rastgele"
              />
              <SidebarLink
                href={buildHref({ kategori, marka, sirala, q }, "sirala", "fiyat-artan")}
                active={sirala === "fiyat-artan"}
                label="Fiyat: Artan"
              />
              <SidebarLink
                href={buildHref({ kategori, marka, sirala, q }, "sirala", "fiyat-azalan")}
                active={sirala === "fiyat-azalan"}
                label="Fiyat: Azalan"
              />
            </nav>
          </div>

          {/* Marka */}
          <div className="px-5 py-5">
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">Marka</p>
            <nav className="space-y-0">
              <SidebarLink
                href={buildHref({ kategori, marka: "", sirala, q }, "marka", "")}
                active={!marka}
                label="Tüm Markalar"
              />
              {brands.map((b) => (
                <SidebarLink
                  key={b.slug}
                  href={buildHref({ kategori, marka, sirala, q }, "marka", b.slug)}
                  active={marka === b.slug}
                  label={b.name}
                />
              ))}
            </nav>
          </div>
        </aside>

        {/* ═══════════════════════════════════════
            ÜRÜN ALANI
        ═══════════════════════════════════════ */}
        <div className="flex-1 min-w-0 p-3 md:p-5">

          {/* Mobil filtre drawer */}
          <HomeFilterClient
            categories={categories}
            brands={brands}
            activeKategori={kategori}
            activeMarka={marka}
            activeSirala={sirala}
            activeQ={q}
          />

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="font-serif text-5xl text-[#C4A882] opacity-20 mb-5">◈</p>
              <h2 className="font-serif text-xl text-[#1A1A1A] mb-2">Sonuç bulunamadı</h2>
              <p className="font-sans text-sm text-[#9A9A9A] mb-6">Filtreleri değiştirerek tekrar deneyin.</p>
              <a href="/" className="font-sans text-[11px] tracking-[0.25em] uppercase border border-[#1A1A1A] px-6 py-2.5 hover:bg-[#1A1A1A] hover:text-white transition-colors">
                Sıfırla
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
              {products.map((product) => {
                const price    = Number(product.price);
                const compare  = product.comparePrice ? Number(product.comparePrice) : null;
                const discount = compare ? Math.round((1 - price / compare) * 100) : null;
                const img      = product.images?.[0] ?? null;
                const inStock  = product.stock > 0;
                return (
                  <article
                    key={product.id}
                    className="group bg-white border border-[#E8E4DE] hover:border-[#C4A882] hover:shadow-sm transition-all duration-200 flex flex-col"
                  >
                    {/* Görsel alanı — <a> yok, WA ile iç içe girmiyor */}
                    <div className="relative overflow-hidden bg-[#F7F4F0]" style={{ aspectRatio: "3/4" }}>
                      <Link
                        href={`/urunler/${product.slug}`}
                        className="absolute inset-0"
                        aria-label={product.name}
                      />
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
                        <span className="absolute top-2 right-2 bg-[#1A1A1A]/70 text-white font-sans text-[7px] tracking-widest uppercase px-1.5 py-0.5 pointer-events-none">
                          Tükendi
                        </span>
                      )}
                      {discount && inStock && (
                        <span className="absolute top-2 left-2 bg-[#C4A882] text-white font-sans text-[7px] tracking-wide uppercase px-1.5 py-0.5 pointer-events-none">
                          -%{discount}
                        </span>
                      )}
                      <AddToCartButton productId={product.id} loggedIn={loggedIn} />
                    </div>

                    <div className="p-2 md:p-2.5 flex flex-col flex-1">
                      {product.brand?.name && (
                        <p className="font-sans text-[7px] tracking-[0.2em] text-[#C4A882] uppercase mb-0.5 truncate">
                          {product.brand.name}
                        </p>
                      )}
                      <Link href={`/urunler/${product.slug}`} className="block">
                        <h3 className="font-sans text-[11px] md:text-xs leading-snug text-[#1A1A1A] hover:text-[#C4A882] transition-colors line-clamp-2 mb-1">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="font-sans text-xs md:text-sm font-semibold text-[#1A1A1A] mt-auto">
                        {price.toLocaleString("tr-TR")} ₺
                        {compare && (
                          <span className="ml-1.5 text-[10px] font-normal text-[#C4A882] line-through">
                            {compare.toLocaleString("tr-TR")} ₺
                          </span>
                        )}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Yardımcı: sidebar link ─── */
function SidebarLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`block py-1.5 px-1 font-sans text-[13px] transition-colors border-l-2 pl-2 ${
        active
          ? "border-[#C4A882] text-[#1A1A1A] font-semibold"
          : "border-transparent text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-[#E8E4DE]"
      }`}
    >
      {label}
    </a>
  );
}

/* ─── Günlük seed ile Fisher-Yates shuffle (server+client aynı sonucu verir) ─── */
function seededShuffle<T>(arr: T[]): T[] {
  // Her gün değişen seed — saatlik değişim istersen Date.getHours() ekle
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

/* ─── buildHref ─── */
function buildHref(
  state: { kategori: string; marka: string; sirala: string; q: string },
  key: string,
  value: string,
) {
  const next = { ...state, [key]: value };
  const p = new URLSearchParams();
  if (next.kategori) p.set("kategori", next.kategori);
  if (next.marka)    p.set("marka",    next.marka);
  if (next.sirala)   p.set("sirala",   next.sirala);
  if (next.q)        p.set("q",        next.q);
  return `/${p.toString() ? `?${p}` : ""}`;
}
