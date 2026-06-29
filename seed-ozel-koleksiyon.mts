import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Fiyatı 4000 TL ve üzeri olan ürünlerin tümünü özel koleksiyona ekle
  const result = await prisma.product.updateMany({
    where: { deletedAt: null, isActive: true, isOzelKoleksiyon: false, price: { gte: 4000 } },
    data: { isOzelKoleksiyon: true },
  });
  console.log(`4000+ TL ürünler eklendi: ${result.count}`);

  // 3500+ TL brandlı ürünlerden de ekle
  const result2 = await prisma.product.updateMany({
    where: { deletedAt: null, isActive: true, isOzelKoleksiyon: false, price: { gte: 3500 }, brandId: { not: null } },
    data: { isOzelKoleksiyon: true },
  });
  console.log(`3500+ TL markalı ürünler eklendi: ${result2.count}`);

  const total = await prisma.product.count({ where: { isOzelKoleksiyon: true, deletedAt: null } });
  console.log(`\n✅ Özel koleksiyon toplam: ${total} ürün`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
