import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { name: "asc" },
    select: {
      productNo: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      b2bPrice: true,
      costPriceUsd: true,
      stock: true,
      isTester: true,
      fragranceFamily: true,
      concentration: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  const headers = [
    "Ürün No", "Ürün Adı", "Marka", "Kategori",
    "Koku Ailesi", "Konsantrasyon",
    "Satış Fiyatı (TL)", "Eski Fiyat (TL)", "Bayi Fiyatı (TL)", "Geliş ($)",
    "Stok", "Tester", "URL",
  ];

  const rows = products.map((p) => [
    p.productNo ?? "",
    p.name,
    p.brand?.name ?? "",
    p.category?.name ?? "",
    p.fragranceFamily ?? "",
    p.concentration ?? "",
    Number(p.price).toFixed(2),
    p.comparePrice ? Number(p.comparePrice).toFixed(2) : "",
    p.b2bPrice ? Number(p.b2bPrice).toFixed(2) : "",
    p.costPriceUsd ? Number(p.costPriceUsd).toFixed(2) : "",
    String(p.stock),
    p.isTester ? "Evet" : "Hayır",
    `https://ormivo.com/urunler/${p.slug}`,
  ]);

  // UTF-8 BOM ekle — Excel Türkçe karakterleri doğru okusun
  const bom = "﻿";
  const csv = bom + [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ormivo-urunler-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
