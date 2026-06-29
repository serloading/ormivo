import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Stock=0 olan ürünlere stock=10 yap + images boş olanlara placeholder ekle
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, stock: true, images: true },
  });

  let stockUpdated = 0;
  let imageUpdated = 0;

  for (const p of products) {
    const images = p.images as string[];
    const needsImage = images.length === 0;
    const needsStock = p.stock === 0;

    if (needsImage || needsStock) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          ...(needsStock ? { stock: 10 } : {}),
          ...(needsImage ? { images: ['/placeholder.svg'] } : {}),
        },
      });
      if (needsStock) stockUpdated++;
      if (needsImage) imageUpdated++;
    }
  }

  console.log(`✅ Stock güncellenen: ${stockUpdated}`);
  console.log(`✅ Görsel eklenen: ${imageUpdated}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
