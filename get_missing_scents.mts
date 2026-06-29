import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, OR: [{ scentNotes: null }, { scentNotes: '' }] },
    select: { id: true, name: true, brand: { select: { name: true } } },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  });

  for (const p of products) {
    console.log(`${p.id}|${p.brand?.name ?? ''}|${p.name}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
