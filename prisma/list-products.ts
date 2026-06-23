import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, brand: { select: { name: true } }, category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  console.log(`TOPLAM: ${products.length}`);
  products.forEach(p =>
    console.log(`${p.name}\t${p.brand?.name ?? "—"}\t${p.category?.name ?? "—"}`)
  );
}

main().finally(() => prisma.$disconnect());
