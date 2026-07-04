import { redirect }    from "next/navigation";
import { getSession }  from "@/lib/session";
import { prisma }      from "@/lib/prisma";
import Link            from "next/link";
import FavorilerimClient from "./FavorilerimClient";
import { getSegmentSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Favorilerim — Ormivo" };

export default async function FavorilerimPage() {
  const session = await getSession();
  if (!session) redirect("/giris");

  const isB2B       = session.isB2BApproved ?? false;
  const b2bMarkup   = session.b2bMarkup ?? null;
  const userSegment = session.segment ?? null;

  const [favorites, favoriteLists, segmentSettings] = await Promise.all([
    prisma.favorite.findMany({
      where:   { userId: session.userId },
      include: { product: { include: { brand: true, category: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favoriteList.findMany({
      where:   { userId: session.userId },
      orderBy: { createdAt: "desc" },
    }),
    getSegmentSettings(),
  ]);

  // Fetch products for existing lists
  const allListProductIds = [...new Set(favoriteLists.flatMap((l) => l.productIds))];
  const listProducts = allListProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: allListProductIds }, deletedAt: null },
        select: { id: true, name: true, slug: true, images: true, price: true, brand: { select: { name: true } } },
      })
    : [];

  const productMap = new Map(listProducts.map((p) => [p.id, p]));

  const serializedFavs = favorites.map((f) => ({
    id: f.product.id,
    name: f.product.name,
    slug: f.product.slug,
    images: f.product.images,
    price: Number(f.product.price),
    costPrice: f.product.costPrice != null ? Number(f.product.costPrice) : null,
    brandName: f.product.brand?.name ?? null,
    categoryName: f.product.category?.name ?? null,
  }));

  const serializedLists = favoriteLists.map((l) => ({
    id: l.id,
    name: l.name,
    productIds: l.productIds,
    createdAt: l.createdAt.toISOString(),
    products: l.productIds
      .map((pid) => productMap.get(pid))
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        name: p!.name,
        slug: p!.slug,
        images: p!.images,
        price: Number(p!.price),
        brandName: p!.brand?.name ?? null,
      })),
  }));

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        {/* Başlık */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/hesabim" className="text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <h1 className="font-serif text-2xl text-[#1A1A1A]">Favorilerim</h1>
            <p className="font-sans text-sm text-[#9A9A9A] mt-0.5">{favorites.length} ürün favorilendi</p>
          </div>
        </div>

        <FavorilerimClient
          favorites={serializedFavs}
          lists={serializedLists}
          isB2B={isB2B}
          b2bMarkup={b2bMarkup}
          userSegment={userSegment}
          segmentSettings={segmentSettings}
        />
      </div>
    </div>
  );
}
