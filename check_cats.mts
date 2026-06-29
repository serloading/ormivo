import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres' });
const prisma = new PrismaClient({ adapter } as any);
const total = await prisma.product.count({ where: { isOzelKoleksiyon: true, deletedAt: null } });
console.log('Ozel koleksiyon toplam:', total);
const notMarked = await prisma.product.count({ where: { isOzelKoleksiyon: false, deletedAt: null } });
console.log('Isaretlenmemis:', notMarked);
await prisma.$disconnect();
