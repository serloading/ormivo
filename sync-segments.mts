import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  // Segmenti olan tüm Customer'ları al
  const customers = await prisma.customer.findMany({
    where: { segment: { not: null }, phone: { not: null } },
    select: { phone: true, segment: true, name: true },
  });

  console.log(`Segment atanmış ${customers.length} müşteri bulundu.`);

  let updated = 0;
  for (const c of customers) {
    const phone = c.phone!.trim().replace(/\s/g, '');
    const result = await prisma.siteUser.updateMany({
      where: { phone },
      data: { segment: c.segment },
    });
    if (result.count > 0) {
      console.log(`✓ ${c.name} (${phone}) → ${c.segment}`);
      updated += result.count;
    }
  }

  console.log(`\nToplam ${updated} SiteUser güncellendi.`);
  await prisma.$disconnect();
}

main().catch(console.error);
