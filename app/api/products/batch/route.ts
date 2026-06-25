import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json() as { ids?: unknown };
  const ids  = body.ids;
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json([]);
  const safeIds = ids.filter((id): id is string => typeof id === "string").slice(0, 100);

  const products = await prisma.product.findMany({
    where: { id: { in: safeIds }, isActive: true },
    select: { id: true, name: true, slug: true, price: true, images: true, brand: { select: { name: true } } },
  });

  type BatchProduct = { id: string; name: string; slug: string; price: unknown; images: unknown; brand: { name: string } | null };
  return NextResponse.json(
    (products as BatchProduct[]).map((p) => ({
      id:     p.id,
      name:   p.name,
      slug:   p.slug,
      price:  Number(p.price),
      images: p.images,
      brand:  p.brand?.name ?? null,
    }))
  );
}
