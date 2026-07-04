const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const CHRISTIAN_DIOR_BRAND_ID = 'cmqr01one000vegtyeozkf661';
const DIOR_BRAND_ID            = 'cmqr01ozc000xegtyqft1pkjp';

// Clear duplicate: Dior Jadore EDP (wrong spelling, no apostrophe) — J'adore EDP is already coming from Christian Dior
const DUPLICATE_TO_DELETE = 'cmqqzw9ip003f1gtylg8o73ju'; // Dior Jadore EDP (Dior brand)

async function main() {
  // 1. Move all Christian Dior products → Dior brand
  const r1 = await prisma.product.updateMany({
    where: { brandId: CHRISTIAN_DIOR_BRAND_ID, deletedAt: null },
    data:  { brandId: DIOR_BRAND_ID },
  });
  console.log(`Christian Dior urunleri tasindi: ${r1.count}`);

  // 2. Fix product name "Christian Dior Gris Dior" → "Dior Gris Dior"
  const r2 = await prisma.product.updateMany({
    where: { name: 'Christian Dior Gris Dior', brandId: DIOR_BRAND_ID },
    data:  { name: 'Dior Gris Dior' },
  });
  console.log(`Isim duzeltildi: ${r2.count}`);

  // 3. Soft-delete the duplicate J'adore (Jadore without apostrophe)
  const r3 = await prisma.product.update({
    where: { id: DUPLICATE_TO_DELETE },
    data:  { deletedAt: new Date(), isActive: false },
  });
  console.log(`Kopya silindi: ${r3.name}`);

  // 4. Delete the Christian Dior brand (no products left)
  await prisma.brand.delete({ where: { id: CHRISTIAN_DIOR_BRAND_ID } });
  console.log('Christian Dior markasi silindi');

  // Summary
  const total = await prisma.product.count({ where: { brandId: DIOR_BRAND_ID, deletedAt: null } });
  console.log(`Dior markasinda toplam aktif urun: ${total}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
