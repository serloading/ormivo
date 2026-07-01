/**
 * Tüm SiteUser kayıtları için:
 *  1. Telefon numarasını 905XXXXXXXXX formatına normalize et
 *  2. Sabit şifreyi hash'leyip kaydet (mustChangePassword = true)
 *
 * Çalıştırmak için: npx tsx scripts/normalize-users.mts
 */

import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "Ormivo2025!";

function canonicalPhone(phone: string): string {
  const digits = phone.trim().replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("90") && digits.length === 12) return digits;
  if (digits.startsWith("0")  && digits.length === 11) return `90${digits.slice(1)}`;
  if (digits.length === 10)                             return `90${digits}`;
  return digits;
}

async function main() {
  const users = await prisma.siteUser.findMany({
    select: { id: true, phone: true, name: true },
  });

  console.log(`\n📋 Toplam ${users.length} kullanıcı bulundu.\n`);

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  let phoneFixed = 0;
  let alreadyOk  = 0;
  let conflicts  = 0;

  for (const user of users) {
    const canonical = canonicalPhone(user.phone);
    const phoneChanged = canonical && canonical !== user.phone;

    const updateData: Record<string, unknown> = {
      passwordHash:       hash,
      mustChangePassword: true,
    };

    if (phoneChanged) {
      const conflict = await prisma.siteUser.findFirst({
        where: { phone: canonical, id: { not: user.id } },
      });
      if (conflict) {
        console.log(`⚠️  ÇAKIŞMA: ${user.name} (${user.phone}) → ${canonical} zaten ${conflict.name} tarafından kullanılıyor. Telefon değiştirilmedi.`);
        conflicts++;
      } else {
        updateData.phone = canonical;
        phoneFixed++;
        console.log(`✅ ${user.name ?? "—"}: ${user.phone} → ${canonical}`);
      }
    } else {
      alreadyOk++;
      console.log(`✓  ${user.name ?? "—"}: ${user.phone}`);
    }

    await prisma.siteUser.update({
      where: { id: user.id },
      data: updateData,
    });
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Tamamlandı
   Telefon düzeltilen  : ${phoneFixed}
   Format zaten doğru  : ${alreadyOk}
   Çakışma (atlandı)   : ${conflicts}
   Şifre güncellenen   : ${users.length}
   Varsayılan şifre    : ${DEFAULT_PASSWORD}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kullanıcılar bir sonraki girişte bu şifreyi kullanabilir.
mustChangePassword = true → giriş sonrası şifre değiştirme yönlendirmesi aktif.
`);
}

main()
  .catch((e) => { console.error("HATA:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
