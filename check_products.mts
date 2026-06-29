import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

const products = await prisma.product.findMany({
  select: { name: true, brand: { select: { name: true } } },
  orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
});
const byBrand: Record<string, string[]> = {};
for (const p of products) {
  const b = p.brand?.name ?? 'NO BRAND';
  if (!byBrand[b]) byBrand[b] = [];
  byBrand[b].push(p.name);
}
console.log(JSON.stringify(byBrand));
