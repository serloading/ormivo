import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Türkçede ASCII yerine geçen hatalı kalıplar
// Her kelimede "c", "g", "i", "o", "s", "u" yerinde Türkçe karakter olması gereken durumlar
const SUSPECT_PATTERNS = [
  /\bkoku(su|yu|lar|lari|dan|yla|yu|da|de|nun|nun|cu|nun)\b/g,  // koku* - bunlar zaten doğru
  /\bsiklet\b/g,   // şiklet?
  /\bsikayeti\b/g,
  /\bsimdi\b/g,    // şimdi
  /\bsinema\b/g,
  /\bseker\b/g,    // şeker
  /\bsahane\b/g,   // şahane
  /\bsiir\b/g,     // şiir
  /\bseffaf\b/g,   // şeffaf
  /\bsarap\b/g,    // şarap
  /\bsifali\b/g,   // şifalı
  /\bsiddetli\b/g, // şiddetli
  /\bcok\b/g,      // çok
  /\bcekici\b/g,
  /\bcilek\b/g,    // çilek
  /\bcogu\b/g,     // çoğu
  /\bcocuk\b/g,    // çocuk
  /\bcesitli\b/g,  // çeşitli
  /\bcesit\b/g,    // çeşit
  /\bcevre\b/g,    // çevre
  /\bcicek\b/g,
  /\buzak\b/g,     // uzak - bu doğru zaten
  /\bguc\b/g,      // güç
  /\bguclu\b/g,    // güçlü
  /\bgunluk\b/g,   // günlük
  /\bgun\b/g,      // gün
  /\bgune\b/g,     // güne
  /\bgunes\b/g,    // güneş
  /\bguzel\b/g,    // güzel
  /\bguzellik\b/g, // güzellik
  /\bguz\b/g,      // güz (sonbahar)
  /\buzu\b/g,      // üzü?
  /\bozgun\b/g,    // özgün
  /\bozgur\b/g,    // özgür
  /\bozgurce\b/g,
  /\bozgun\b/g,
  /\bIrk\b/g,
];

async function main() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, description: { not: null } },
    select: { id: true, name: true, description: true },
  });

  console.log(`Toplam ürün: ${products.length}`);

  // Hatalı kalıpları bul
  const problemWords = new Map<string, number>();

  for (const p of products) {
    const desc = p.description ?? "";
    // Hatalı Türkçe kalıplar - kelime başında "s" "c" "g" "o" "u" gibi
    const words = desc.split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
      // ASCII-only Türkçe kelimeler şüpheli
      if (/^[a-z]+$/.test(clean) && clean.length > 3) {
        // Türkçeye özgü kalıpları ara
        if (/^(s[aeiou]|s[hk]|sek|sim|san|sar|sif|sid|sah|sia|sie)/i.test(clean)) {
          problemWords.set(clean, (problemWords.get(clean) ?? 0) + 1);
        }
        if (/^c[eiou]/i.test(clean) && !/^(com|con|cor|col|cer|cel|cen|cent|co[mnpr]|cr|cl)/i.test(clean)) {
          problemWords.set(clean, (problemWords.get(clean) ?? 0) + 1);
        }
        if (/^gu[ncz]/i.test(clean)) {
          problemWords.set(clean, (problemWords.get(clean) ?? 0) + 1);
        }
        if (/^oz[gk]/i.test(clean)) {
          problemWords.set(clean, (problemWords.get(clean) ?? 0) + 1);
        }
      }
    }
  }

  const sorted = [...problemWords.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60);
  console.log("\nEn sık geçen şüpheli kelimeler:");
  for (const [word, count] of sorted) {
    console.log(`  ${word}: ${count}`);
  }

  // Birkaç örnek açıklama göster
  const sample = products.slice(0, 3);
  for (const p of sample) {
    console.log(`\n--- ${p.name} ---`);
    console.log(p.description?.slice(0, 300));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
