import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const badNameFragment = "Yukarıda Verdiğim Ürün Listesini";

const matches = await prisma.product.findMany({
  where: {
    name: {
      contains: badNameFragment,
      mode: "insensitive",
    },
  },
  select: {
    id: true,
    name: true,
    brand: { select: { name: true } },
    category: { select: { name: true } },
  },
});

console.log(`Matched ${matches.length} bad products`);
for (const item of matches) {
  console.log(JSON.stringify(item));
}

if (matches.length) {
  await prisma.product.deleteMany({
    where: {
      name: {
        contains: badNameFragment,
        mode: "insensitive",
      },
    },
  });
  console.log(`Deleted ${matches.length} bad products`);
}

await prisma.$disconnect();
