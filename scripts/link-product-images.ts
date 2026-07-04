import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  // PRD- ile başlayan tüm dosyaları oku
  const files = fs
    .readdirSync(uploadsDir)
    .filter((f) => f.toUpperCase().startsWith("PRD-") && /\.(jpg|png|webp|jpeg)$/i.test(f))
    .sort();

  console.log(`📁 Toplam ${files.length} görsel bulundu\n`);

  const skipped: string[] = [];
  const updated: { productNo: string; imageName: string }[] = [];

  for (const file of files) {
    // Dosya adından ProductNo çıkar: "PRD-0001.jpg" → "PRD-0001"
    const productNo = path.parse(file).name.toUpperCase();
    const imageUrl = `/uploads/${file}`;

    try {
      // Ürünü bul
      const product = await prisma.product.findUnique({
        where: { productNo },
      });

      if (!product) {
        console.log(`❌ ATLANDI: ${productNo} — Ürün bulunamadı`);
        skipped.push(productNo);
        continue;
      }

      // Görsel zaten ekli mi kontrol et
      if (product.images.includes(imageUrl)) {
        console.log(`⏭️  ATLANIDI: ${productNo} — Görsel zaten ekliydi`);
        continue;
      }

      // Görseli ekle
      const updatedImages = [...product.images, imageUrl];
      await prisma.product.update({
        where: { id: product.id },
        data: { images: updatedImages },
      });

      console.log(`✅ BAŞARILI: ${productNo} — ${file}`);
      updated.push({ productNo, imageName: file });
    } catch (error) {
      console.error(`⚠️  HATA: ${productNo} — ${error}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 ÖZET:`);
  console.log(`✅ Başarıyla güncellenen: ${updated.length}`);
  console.log(`❌ Atlanan (bulunamayan ürün): ${skipped.length}`);

  if (skipped.length > 0) {
    console.log(`\n⚠️  ATLANAN ÜRÜNLER (bu görselleri tekrar eklemen lazım):\n`);
    skipped.forEach((prd) => console.log(`   ${prd}`));

    // Bir metin dosyası olarak da kaydet
    const report = skipped.join("\n");
    const reportPath = path.join(process.cwd(), "skipped-products.txt");
    fs.writeFileSync(reportPath, report, "utf-8");
    console.log(`\n📄 Rapor kaydedildi: skipped-products.txt`);
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  });
