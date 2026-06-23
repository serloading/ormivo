import { prisma }         from "@/lib/prisma";
import { getSession }     from "@/lib/session";
import HomeFilterClient   from "@/components/site/HomeFilterClient";
import MarqueeBanner      from "@/components/site/MarqueeBanner";
import ProductGrid        from "@/components/site/ProductGrid";
import CollapsibleList    from "@/components/site/CollapsibleList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ormivo — Parfüm Kataloğu" };

const INITIAL_LIMIT = 15;

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

  const isOzelFilter = kategori === "ozel-koleksiyon";
  const where = {
    deletedAt: null,
    isActive:  true,
    ...(isOzelFilter           ? { isOzelKoleksiyon: true }            : {}),
    ...(kategori && !isOzelFilter ? { category: { slug: kategori } }   : {}),
    ...(marka    ? { brand:    { slug: marka    } } : {}),
    ...(q        ? { name:     { contains: q, mode: "insensitive" as const } } : {}),
  };

  const session  = await getSession();
  const loggedIn = !!session;

  const [rawProducts, categories, brands] = await Promise.all([
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
  ]);

  type RawProduct = { id: string; slug: string; name: string; price: unknown; comparePrice: unknown; images: string[]; stock: number; brand: { name: string } | null };
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
    images:       p.images as string[],
    stock:        p.stock,
    brand:        p.brand ? { name: p.brand.name } : null,
  }));

  /* ── Sidebar link builder ── */
  const href = (key: string, value: string) => buildHref({ kategori, marka, sirala, q }, key, value);

  const categoryItems = [
    { href: href("kategori", ""), active: !kategori, label: "Tümü" },
    ...(categories as RawCategory[]).map((c) => ({ href: href("kategori", c.slug), active: kategori === c.slug, label: c.name })),
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

          <div className="px-5 py-5">
            <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-3">Marka</p>
            <CollapsibleList items={brandItems} initialShow={8} label="marka" />
          </div>
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

          <ProductGrid
            initialProducts={initialProducts}
            total={allProducts.length}
            loggedIn={loggedIn}
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

/* ─── buildHref ─── */
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
