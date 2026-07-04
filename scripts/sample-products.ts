import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    select: { productNo: true, name: true, images: true },
    take: 10,
  });

  console.log("📦 ÖRnek Ürünler ve Görsel Yolları:\n");
  products.forEach((p) => {
    console.log(`ProductNo: ${p.productNo}`);
    console.log(`Adı: ${p.name}`);
    console.log(`Görseller:`);
    p.images.forEach((img) => console.log(`  └─ ${img}`));
    console.log();
  });
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
