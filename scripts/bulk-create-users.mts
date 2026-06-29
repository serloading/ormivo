/**
 * Sistemde kayıtlı tüm Customer'lar için SiteUser oluşturur.
 * Zaten SiteUser'ı olan müşterileri atlar.
 * Varsayılan şifre: Ormivo2025
 *
 * Çalıştırma: npx tsx scripts/bulk-create-users.mts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const DEFAULT_PASSWORD = "Ormivo2025";

async function main() {
  const customers = await prisma.customer.findMany({
    where: { phone: { not: null } },
    select: { id: true, name: true, phone: true, segment: true },
  });

  console.log(`Toplam müşteri: ${customers.length}`);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let created = 0;
  let skipped = 0;
  let noPhone = 0;

  for (const customer of customers) {
    if (!customer.phone) { noPhone++; continue; }

    // Telefonu normalize et
    const digits = customer.phone.replace(/\D/g, "");
    const canonical = digits.startsWith("90") ? "0" + digits.slice(2)
      : digits.startsWith("0") ? digits
      : "0" + digits;

    // Tüm varyantları dene
    const variants = [canonical, digits, "90" + canonical.slice(1)];

    const existing = await prisma.siteUser.findFirst({
      where: { phone: { in: variants } },
    });

    if (existing) { skipped++; continue; }

    try {
      await prisma.siteUser.create({
        data: {
          name:         customer.name,
          phone:        canonical,
          passwordHash: passwordHash,
          segment:      customer.segment ?? null,
        },
      });
      created++;
      console.log(`✓ Oluşturuldu: ${customer.name} (${canonical})`);
    } catch (e) {
      console.error(`✗ Hata: ${customer.name} (${canonical})`, e);
    }
  }

  console.log(`\nTamamlandı: ${created} oluşturuldu, ${skipped} zaten vardı, ${noPhone} telefon yok.`);
  console.log(`Varsayılan şifre: ${DEFAULT_PASSWORD}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
