import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const REVIEW_HINTS = [
  "SPARLING",
  "CHOLE",
  "CHERY",
  "METICS",
  "VALENTINIO",
  "LUMINENE",
  "ZETN",
  "IVICOLI",
  "APERITIVO",
  "MISS CHERY",
  "FASHION DECRE",
];

function formatMoney(value) {
  if (value == null) return "-";
  return typeof value === "string" ? value : String(value);
}

const samples = await prisma.product.findMany({
  where: {
    createdAt: {
      gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  },
  select: {
    name: true,
    price: true,
    costPrice: true,
    stock: true,
    brand: { select: { name: true } },
    category: { select: { name: true, slug: true } },
    createdAt: true,
  },
  orderBy: { createdAt: "desc" },
  take: 12,
});

const reviewCandidates = await prisma.product.findMany({
  where: {
    OR: REVIEW_HINTS.map((hint) => ({
      name: { contains: hint, mode: "insensitive" },
    })),
  },
  select: {
    name: true,
    price: true,
    costPrice: true,
    stock: true,
    brand: { select: { name: true } },
    category: { select: { name: true, slug: true } },
  },
  orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
});

const allRecent = await prisma.product.findMany({
  where: {
    createdAt: {
      gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  },
  select: {
    name: true,
    brand: { select: { name: true } },
    category: { select: { name: true, slug: true } },
    price: true,
    costPrice: true,
    stock: true,
  },
});

const longOrSentenceLike = allRecent
  .filter((p) => p.name.length > 80 || /[.!?]/.test(p.name) || /yukarida|sistemimizdekiler|marka alanlari|stok ekle|yapay zeka|sonra da|değişiklik/i.test(p.name))
  .sort((a, b) => b.name.length - a.name.length);

console.log("SAMPLES");
for (const p of samples) {
  console.log(
    JSON.stringify({
      brand: p.brand?.name ?? null,
      name: p.name,
      category: p.category?.name ?? null,
      categorySlug: p.category?.slug ?? null,
      price: formatMoney(p.price),
      costPrice: formatMoney(p.costPrice),
      stock: p.stock,
      createdAt: p.createdAt.toISOString(),
    }),
  );
}

console.log("REVIEW");
for (const p of reviewCandidates) {
  console.log(
    JSON.stringify({
      brand: p.brand?.name ?? null,
      name: p.name,
      category: p.category?.name ?? null,
      categorySlug: p.category?.slug ?? null,
      price: formatMoney(p.price),
      costPrice: formatMoney(p.costPrice),
      stock: p.stock,
    }),
  );
}

console.log("LONG_OR_SENTENCE_LIKE");
for (const p of longOrSentenceLike) {
  console.log(
    JSON.stringify({
      brand: p.brand?.name ?? null,
      name: p.name,
      category: p.category?.name ?? null,
      categorySlug: p.category?.slug ?? null,
      price: formatMoney(p.price),
      costPrice: formatMoney(p.costPrice),
      stock: p.stock,
      length: p.name.length,
    }),
  );
}

await prisma.$disconnect();
