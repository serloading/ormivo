import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter } as any);
const products = await prisma.product.findMany({
  where: { deletedAt: null },
  orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  select: { name: true, price: true, brand: { select: { name: true } }, category: { select: { name: true } }, isActive: true },
});
products.forEach((p: any, i: number) => {
  const status = p.isActive ? '' : ' [PASİF]';
  console.log(`${i+1}. [${p.brand?.name ?? '?'}] ${p.name} — ${p.price} TL (${p.category?.name ?? '?'})${status}`);
});
console.log(`\nToplam: ${products.length} ürün`);
await prisma.$disconnect();
