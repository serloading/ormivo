import { getSession } from "@/lib/session";
import { getCart }    from "@/lib/actions/cart";
import { prisma }     from "@/lib/prisma";
import LoggedInCart   from "@/components/site/LoggedInCart";
import GuestCart      from "@/components/site/GuestCart";
import { getSegmentSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sepetim — Ormivo" };

export default async function SepetPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="bg-[#FAFAF7] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <h1 className="font-serif text-3xl text-[#1A1A1A] mb-8">Sepetim</h1>
          <GuestCart />
        </div>
      </div>
    );
  }

  const userSegment = session.segment ?? null;

  const [cart, addresses, segmentSettings] = await Promise.all([
    getCart(),
    prisma.address.findMany({
      where:   { userId: session.userId },
      orderBy: { isDefault: "desc" },
    }),
    getSegmentSettings(),
  ]);

  const items = cart?.items ?? [];

  // Cinsiyet tespiti: sepetteki ürünlerin kategorilerine bakarak
  type CartProduct = { id: string; name: string; price: unknown; brand?: { name: string; slug: string } | null; images: string[]; slug: string; categoryId?: string | null };
  const cartCategoryIds = [...new Set(
    items.map((i) => (i.product as CartProduct).categoryId).filter(Boolean) as string[]
  )];
  const cartCategories = cartCategoryIds.length
    ? await prisma.category.findMany({ where: { id: { in: cartCategoryIds } }, select: { id: true, name: true } })
    : [];

  const hasKadin = cartCategories.some((c) => c.name.toLowerCase().includes("kad"));
  const hasErkek = cartCategories.some((c) => c.name.toLowerCase().includes("erkek"));

  type CrossSell = { id: string; name: string; slug: string; price: number; comparePrice: number | null; images: string[]; brand?: { name: string } | null };
  let crossSellProducts: CrossSell[] = [];

  if (hasKadin && !hasErkek) {
    const erkekCat = await prisma.category.findFirst({ where: { name: { contains: "Erkek", mode: "insensitive" } } });
    if (erkekCat) {
      const prods = await prisma.product.findMany({
        where: { categoryId: erkekCat.id, isActive: true, deletedAt: null, id: { notIn: items.map((i) => i.product.id) } },
        include: { brand: true }, take: 4, orderBy: { createdAt: "desc" },
      });
      crossSellProducts = prods.map((p) => ({ id: p.id, name: p.name, slug: p.slug, price: Number(p.price), comparePrice: p.comparePrice ? Number(p.comparePrice) : null, images: p.images, brand: p.brand }));
    }
  } else if (hasErkek && !hasKadin) {
    const kadinCat = await prisma.category.findFirst({ where: { name: { contains: "Kad", mode: "insensitive" } } });
    if (kadinCat) {
      const prods = await prisma.product.findMany({
        where: { categoryId: kadinCat.id, isActive: true, deletedAt: null, id: { notIn: items.map((i) => i.product.id) } },
        include: { brand: true }, take: 4, orderBy: { createdAt: "desc" },
      });
      crossSellProducts = prods.map((p) => ({ id: p.id, name: p.name, slug: p.slug, price: Number(p.price), comparePrice: p.comparePrice ? Number(p.comparePrice) : null, images: p.images, brand: p.brand }));
    }
  }

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <h1 className="font-serif text-3xl text-[#1A1A1A] mb-1">Sepetim</h1>
        <p className="font-sans text-sm text-[#9A9A9A] mb-8">
          {session.name ? `Merhaba ${session.name}` : session.phone}
        </p>
        <LoggedInCart
          items={items}
          addresses={addresses}
          crossSellProducts={crossSellProducts}
          userSegment={userSegment}
          segmentSettings={segmentSettings}
        />
      </div>
    </div>
  );
}
