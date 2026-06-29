import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, comparePrice: null },
    select: { id: true, price: true },
  });

  console.log(`comparePrice eksik olan ${products.length} ürün bulundu.`);

  let updated = 0;
  for (const p of products) {
    const price = Number(p.price);
    // comparePrice = eski/liste fiyatı, price'tan büyük olmalı
    // Kullanıcı isteği: ucuzlara 750 ekle, pahalılara 1250 ekle
    const add = price < 1000 ? 750 : 1250;
    const comparePrice = Math.round(price + add);
    await prisma.product.update({ where: { id: p.id }, data: { comparePrice } });
    updated++;
    if (updated % 100 === 0) console.log(`  ${updated}/${products.length}...`);
  }

  console.log(`✅ ${updated} ürüne comparePrice eklendi.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
