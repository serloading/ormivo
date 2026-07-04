import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Eski görsel yolları temizleniyor...\n");

  const products = await prisma.product.findMany({
    select: { id: true, productNo: true, name: true, images: true },
  });

  let updated = 0;
  let removed = 0;

  for (const product of products) {
    // Sadece /uploads/PRD- ile başlayan görselleri tut
    const newImages = product.images.filter((img) => img.includes("/uploads/PRD-"));
    const oldImages = product.images.filter((img) => !img.includes("/uploads/PRD-"));

    // Eğer değişme varsa update et
    if (oldImages.length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: newImages },
      });

      if (newImages.length > 0) {
        console.log(`✅ ${product.productNo} — ${oldImages.length} eski görsel kaldırıldı`);
      } else {
        console.log(`⚠️  ${product.productNo} — TÜM görseller kaldırıldı (PRD- görseli yok!)`);
      }

      updated++;
      removed += oldImages.length;
    }
  }

  console.log(`\n📊 ÖZET:`);
  console.log(`✅ Güncellenen ürün: ${updated}`);
  console.log(`🗑️  Kaldırılan eski görsel: ${removed}`);
  console.log(`\n✨ Tamamlandı!`);

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  });
