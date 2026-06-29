import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres' });
const prisma = new PrismaClient({ adapter });

const brands = await prisma.brand.findMany({ select: { name: true }, orderBy: { name: 'asc' } });
const cats = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
const prodCount = await prisma.product.count();
console.log('BRANDS:' + JSON.stringify(brands.map(b => b.name)));
console.log('CATEGORIES:' + JSON.stringify(cats));
console.log('PRODUCT_COUNT:' + prodCount);
