import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json([]);

  const [products, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, slug: true, images: true, brand: { select: { name: true } } },
      take: 6,
    }),
    prisma.brand.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 3,
    }),
  ]);

  const results = [
    ...brands.map((b) => ({ type: "brand" as const, id: b.id, name: b.name, slug: b.slug, image: null, brandName: null })),
    ...products.map((p) => ({ type: "product" as const, id: p.id, name: p.name, slug: p.slug, image: p.images[0] ?? null, brandName: p.brand?.name ?? null })),
  ];

  return NextResponse.json(results);
}
