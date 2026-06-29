import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const UNISEX_ID = "43814ff0-f64a-48cc-be2e-07fde204bce6";
const KADIN_ID  = "157a83bd-ac0e-4209-afbe-4a6b521c0d1c";
const ERKEK_ID  = "1396bc28-5544-4b6e-b002-b7dbd2dc4569";

const ERKEK_RE = /\b(men|homme|pour homme|for men|for him)\b/i;
const KADIN_RE = /\b(women|woman|femme|pour femme|for her|for women)\b/i;

async function main() {
  const products = await prisma.product.findMany({
    where: { categoryId: UNISEX_ID, deletedAt: null },
    select: { id: true, name: true },
  });

  let kadın = 0, erkek = 0;
  for (const p of products) {
    if (KADIN_RE.test(p.name)) {
      await prisma.product.update({ where: { id: p.id }, data: { categoryId: KADIN_ID } });
      console.log("KADIN →", p.name);
      kadın++;
    } else if (ERKEK_RE.test(p.name)) {
      await prisma.product.update({ where: { id: p.id }, data: { categoryId: ERKEK_ID } });
      console.log("ERKEK →", p.name);
      erkek++;
    }
  }

  console.log(`\nKadın: ${kadın}, Erkek: ${erkek} ürün taşındı.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
