import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 1) return NextResponse.json([]);

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      name: { contains: q, mode: "insensitive" },
    },
    select: { id: true, name: true, costPrice: true },
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json(
    products.map((p) => ({ id: p.id, name: p.name, costPrice: p.costPrice ? Number(p.costPrice) : null }))
  );
}
