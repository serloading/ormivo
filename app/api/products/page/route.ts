import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function todaySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export async function GET(req: NextRequest) {
  const sp       = req.nextUrl.searchParams;
  const kategori = sp.get("kategori") ?? "";
  const marka    = sp.get("marka")    ?? "";
  const q        = sp.get("q")        ?? "";
  const sirala   = sp.get("sirala")   ?? "";
  const offset   = Math.max(0, parseInt(sp.get("offset") ?? "0", 10));
  const limit    = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "15", 10)));

  // Kategori filtresi: primary + extraCategoryIds
  let kategoriFilt = {};
  if (kategori) {
    const cat = await prisma.category.findFirst({ where: { slug: kategori }, select: { id: true } });
    kategoriFilt = cat
      ? { OR: [{ category: { slug: kategori } }, { extraCategoryIds: { has: cat.id } }] }
      : { category: { slug: kategori } };
  }

  const where = {
    deletedAt: null,
    isActive:  true,
    ...kategoriFilt,
    ...(marka ? { brand: { slug: marka } } : {}),
    ...(q     ? { name:  { contains: q, mode: "insensitive" as const } } : {}),
  };

  const orderBy =
    sirala === "fiyat-artan"  ? { price: "asc"  as const } :
    sirala === "fiyat-azalan" ? { price: "desc" as const } :
                                { createdAt: "asc" as const };

  const all = await prisma.product.findMany({
    where,
    include: { category: true, brand: true },
    orderBy,
  });

  const products = (sirala === "fiyat-artan" || sirala === "fiyat-azalan")
    ? all
    : seededShuffle(all, todaySeed());

  const page    = products.slice(offset, offset + limit);
  const hasMore = offset + limit < products.length;

  type PageProduct = { id: string; slug: string; name: string; price: unknown; comparePrice: unknown; images: unknown; stock: number; brand: { name: string } | null };
  const items = (page as PageProduct[]).map((p) => ({
    id:           p.id,
    slug:         p.slug,
    name:         p.name,
    price:        Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    images:       p.images,
    stock:        p.stock,
    brand:        p.brand ? { name: p.brand.name } : null,
  }));

  return NextResponse.json({ items, hasMore, total: products.length });
}
