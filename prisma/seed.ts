import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seed başlıyor...");

  // ── Admin kullanıcısı ────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("ormivo2024", 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@ormivo.com" },
    update: { passwordHash },
    create: {
      email: "admin@ormivo.com",
      name: "Admin",
      passwordHash,
    },
  });
  console.log(`✓ Admin oluşturuldu: ${admin.email}`);

  // ── Kategoriler ──────────────────────────────────────────────────────────
  const [kadin, erkek, unisex, ozel] = await Promise.all([
    prisma.category.upsert({
      where: { slug: "kadin" },
      update: {},
      create: { name: "Kadın Parfümleri", slug: "kadin", description: "Feminen, zarif ve baştan çıkarıcı kadın parfümleri" },
    }),
    prisma.category.upsert({
      where: { slug: "erkek" },
      update: {},
      create: { name: "Erkek Parfümleri", slug: "erkek", description: "Güçlü, maskülen ve etkileyici erkek parfümleri" },
    }),
    prisma.category.upsert({
      where: { slug: "unisex" },
      update: {},
      create: { name: "Unisex", slug: "unisex", description: "Hem kadın hem erkek için zamansız unisex parfümler" },
    }),
    prisma.category.upsert({
      where: { slug: "ozel-koleksiyon" },
      update: {},
      create: { name: "Özel Koleksiyon", slug: "ozel-koleksiyon", description: "Sınırlı sayıda üretilen özel koleksiyon" },
    }),
  ]);
  console.log("✓ 4 kategori oluşturuldu");

  // ── Ürünler ──────────────────────────────────────────────────────────────
  const products = [
    {
      name: "Ambra Noir",
      slug: "ambra-noir",
      description: "Derin amber notalarıyla açılan, kalp notasında gül ve yasemin buketini barındıran, bazında vanilya ve misk ile kapanan büyüleyici bir koku. Gece davetleri ve özel anlar için ideal.",
      price: 890,
      comparePrice: 1100,
      categoryId: kadin.id,
      stock: 24,
      isActive: true,
      images: [],
    },
    {
      name: "Cedar Oud",
      slug: "cedar-oud",
      description: "Orta Doğu'dan gelen saf oud özü ile Kanada sedir ağacının keskin notalarının mükemmel uyumu. Duman, deri ve baharat izleri taşıyan maskülen bir koku.",
      price: 1350,
      categoryId: erkek.id,
      stock: 18,
      isActive: true,
      images: [],
    },
    {
      name: "Rose Eternel",
      slug: "rose-eternel",
      description: "Grasse bölgesinden toplanan Mayıs gülünün taze kokusu. Hafif pudra ve beyaz misk notaları ile tamamlanan zarif parfüm.",
      price: 750,
      categoryId: kadin.id,
      stock: 35,
      isActive: true,
      images: [],
    },
    {
      name: "Santal Blanc",
      slug: "santal-blanc",
      description: "Hindistan sandal ağacının kremsi ve sıcak dokusu, bergamot ve ylang-ylang ile harmanlanmış. Erkek ve kadın için eşit derecede çekici.",
      price: 980,
      comparePrice: 1200,
      categoryId: unisex.id,
      stock: 42,
      isActive: true,
      images: [],
    },
    {
      name: "Iris Lumiere",
      slug: "iris-lumiere",
      description: "Floransalı iris kökünün pudralı ve topraksı özü, violet yaprakları ve beyaz müşkle buluşuyor. Nadir hammaddelerle hazırlanan özel koleksiyon parfümü.",
      price: 1750,
      categoryId: ozel.id,
      stock: 12,
      isActive: true,
      images: [],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`✓ ${products.length} ürün oluşturuldu`);

  console.log("✅ Seed tamamlandı!");
}

main()
  .catch((e) => { console.error("❌ Seed hatası:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
