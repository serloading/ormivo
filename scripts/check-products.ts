import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const products = await prisma.product.findMany({
    where: { productNo: { not: null } },
    select: { id: true, name: true, productNo: true },
    take: 20,
  });

  console.log("Product codes:");
  products.forEach((p) => {
    console.log(`${p.name}: ${p.productNo}`);
  });

  const prefixes: Record<string, number> = {};
  products.forEach((p) => {
    const prefix = p.productNo?.split("-")?.[0] || "NONE";
    prefixes[prefix] = (prefixes[prefix] || 0) + 1;
  });

  console.log("\nPrefixes:");
  console.log(prefixes);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
