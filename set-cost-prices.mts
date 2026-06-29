import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  // Mevcut costPrice dağılımına bak
  const all = await prisma.product.findMany({
    select: { id: true, name: true, price: true, costPrice: true },
    where: { deletedAt: null },
  });

  const withCost = all.filter((p) => p.costPrice !== null);
  const prices = withCost.map((p) => Number(p.costPrice)).sort((a, b) => a - b);
  console.log(`Toplam ürün: ${all.length}, costPrice olan: ${withCost.length}`);
  if (prices.length > 0) {
    console.log(`costPrice min: ${prices[0]}, max: ${prices[prices.length - 1]}`);
    // Dağılım
    const u750 = prices.filter((p) => p <= 1000).length;
    const p1250 = prices.filter((p) => p > 1000).length;
    console.log(`<= 1000: ${u750} ürün, > 1000: ${p1250} ürün`);
  }

  // Threshold: costPrice <= 1000 → 750 (uygun fiyatlı), > 1000 → 1250 (pahalı)
  // costPrice null olanlar → price'a göre: price <= 2500 → 750, > 2500 → 1250
  let updated = 0;
  for (const p of all) {
    let newCost: number;
    if (p.costPrice !== null) {
      newCost = Number(p.costPrice) <= 1000 ? 750 : 1250;
    } else {
      newCost = Number(p.price) <= 2500 ? 750 : 1250;
    }
    await prisma.product.update({
      where: { id: p.id },
      data: { costPrice: newCost },
    });
    updated++;
  }
  console.log(`\n✅ ${updated} ürün güncellendi.`);
  console.log("750 (uygun fiyatlı) ve 1250 (pahalı) olarak ayarlandı.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
