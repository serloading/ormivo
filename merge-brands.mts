import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Carolina Herrera duplikatını bul
  const brands = await prisma.brand.findMany({
    where: { name: { contains: 'Carolina', mode: 'insensitive' } },
    include: { _count: { select: { products: true } } },
  });

  console.log('Bulunan Carolina Herrera markaları:');
  brands.forEach(b => console.log(`  id=${b.id} name="${b.name}" slug="${b.slug}" products=${b._count.products}`));

  if (brands.length < 2) {
    console.log('Yalnızca 1 Carolina Herrera var, birleştirme gerekmez.');
    return;
  }

  // En fazla ürünü olan markayı "ana" yap, diğerini sil
  const sorted = [...brands].sort((a, b) => b._count.products - a._count.products);
  const main_brand = sorted[0];
  const duplicates = sorted.slice(1);

  console.log(`\nAna marka: "${main_brand.name}" (${main_brand._count.products} ürün)`);

  for (const dup of duplicates) {
    console.log(`Birleştiriliyor: "${dup.name}" → "${main_brand.name}"`);
    // Ürünleri ana markaya taşı
    const updated = await prisma.product.updateMany({
      where: { brandId: dup.id },
      data: { brandId: main_brand.id },
    });
    console.log(`  ${updated.count} ürün taşındı`);
    // Duplikat markayı sil
    await prisma.brand.delete({ where: { id: dup.id } });
    console.log(`  Marka silindi: "${dup.name}"`);
  }

  // Ana markanın adını "Carolina Herrera" olarak düzelt
  await prisma.brand.update({
    where: { id: main_brand.id },
    data: { name: 'Carolina Herrera', slug: 'carolina-herrera' },
  });
  console.log('\n✅ Carolina Herrera birleştirmesi tamamlandı.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
