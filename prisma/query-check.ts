import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DB = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [cats, brands, total, noBrand, noCat] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.product.count(),
    prisma.product.count({ where: { brandId: null } }),
    prisma.product.count({ where: { categoryId: null } }),
  ]);
  console.log("=== KATEGORİLER ===");
  cats.forEach(c => console.log(c.id, c.name, c.slug));
  console.log("=== MARKALAR ===");
  brands.forEach(b => console.log(b.id, b.name));
  console.log(`\nToplam: ${total} | Markasız: ${noBrand} | Kategorisiz: ${noCat}`);

  // Örnek ürünler
  const samples = await prisma.product.findMany({
    take: 20,
    select: { id: true, name: true, brand: { select: { name: true } }, category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  console.log("\n=== ÖRNEK ÜRÜNLER ===");
  samples.forEach(p => console.log(`${p.name} | Marka: ${p.brand?.name ?? "YOK"} | Kategori: ${p.category?.name ?? "YOK"}`));
}

main().finally(() => prisma.$disconnect());
