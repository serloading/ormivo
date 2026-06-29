import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

async function main() {
  const total = await prisma.product.count({ where: { deletedAt: null } });
  const withScent = await prisma.product.count({ where: { deletedAt: null, scentNotes: { not: null } } });
  const withoutScent = await prisma.product.count({ where: { deletedAt: null, OR: [{ scentNotes: null }, { scentNotes: '' }] } });
  const withoutImage = await prisma.product.count({ where: { deletedAt: null, images: { equals: [] } } });

  console.log(`Toplam ürün: ${total}`);
  console.log(`Koku notası var: ${withScent}`);
  console.log(`Koku notası YOK: ${withoutScent}`);
  console.log(`Görseli YOK (boş array): ${withoutImage}`);

  // Brands with missing scent notes
  const byBrand = await prisma.product.groupBy({
    by: ['brandId'],
    where: { deletedAt: null, OR: [{ scentNotes: null }, { scentNotes: '' }] },
    _count: true,
  });

  const brands = await prisma.brand.findMany({ select: { id: true, name: true } });
  const brandMap = Object.fromEntries(brands.map(b => [b.id, b.name]));

  console.log('\nKoku notası eksik markalar:');
  for (const b of byBrand.sort((a,b) => b._count - a._count)) {
    console.log(`  ${brandMap[b.brandId ?? ''] ?? 'Marka yok'}: ${b._count} ürün`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
