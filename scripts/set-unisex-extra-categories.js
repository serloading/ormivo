const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const KADIN  = '157a83bd-ac0e-4209-afbe-4a6b521c0d1c';
const ERKEK  = '1396bc28-5544-4b6e-b002-b7dbd2dc4569';
const UNISEX = '43814ff0-f64a-48cc-be2e-07fde204bce6';

async function main() {
  // Get all UNISEX products
  const unisexProducts = await prisma.product.findMany({
    where: { categoryId: UNISEX, deletedAt: null },
    select: { id: true, name: true, extraCategoryIds: true },
  });

  console.log(`Toplam unisex urun: ${unisexProducts.length}`);

  let updated = 0;
  for (const product of unisexProducts) {
    const existing = product.extraCategoryIds ?? [];
    const hasKadin = existing.includes(KADIN);
    const hasErkek = existing.includes(ERKEK);
    if (!hasKadin || !hasErkek) {
      const newIds = [...new Set([...existing, KADIN, ERKEK])];
      await prisma.product.update({
        where: { id: product.id },
        data: { extraCategoryIds: newIds },
      });
      updated++;
    }
  }

  console.log(`Guncellendi: ${updated} urun`);
  console.log(`Zaten guncel: ${unisexProducts.length - updated} urun`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
