import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, description: { not: null } },
    select: { id: true, name: true, description: true },
  });

  // Tüm kelimeleri topla - ASCII only, Türkçe özel karakter yok
  const wordSet = new Map<string, string[]>(); // word -> [örnek bağlam]

  for (const p of products) {
    const desc = p.description ?? "";
    const words = desc.split(/[\s,\.;:!?()\-"'\/\\]+/);
    for (const word of words) {
      if (!/^[a-zA-Z]+$/.test(word)) continue;
      if (word.length < 4) continue;
      const lower = word.toLowerCase();
      if (!wordSet.has(lower)) wordSet.set(lower, []);
      const arr = wordSet.get(lower)!;
      if (arr.length < 2) arr.push(`${p.name.slice(0,30)}: ...${word}...`);
    }
  }

  // Sırala ve göster
  const sorted = [...wordSet.entries()].sort((a, b) => b[1].length - a[1].length);

  console.log("=== ASCII-only Turkish words in descriptions ===\n");

  // İngilizce değil Türkçe olmayı gerektiren kalıplar
  const TURKISH_SUSPECTS = [
    // ş yerine s kullanılan
    /^s[aeiouıüö]/,  // sa, se, si, so, su, sı, sü, sö başlayan
    // ç yerine c kullanılan
    /^c[iıouüae]/,   // ci, cı, co, cu, cü, ce, ca
    // ğ yerine g kullanılan
    /g[u]/,
    // ü yerine u kullanılan
    /^[gk]u/,
    // ö yerine o kullanılan
    /^oz/,
    // ı yerine i kullanılan
    /[aeiou]n[di]/, /[dn]an/, /[dn]in/,
  ];

  // Kesinlikle İngilizce olan kelimeleri filtrele
  const ENGLISH_WHITELIST = new Set([
    "with", "and", "the", "for", "from", "this", "that", "have", "been", "will",
    "saint", "cool", "dark", "fresh", "wood", "rose", "noir", "blue", "gold",
    "black", "white", "pure", "rich", "deep", "warm", "soft", "bold", "wild",
    "notes", "note", "base", "heart", "tonic", "amber", "musk", "cedar",
    "jasmine", "iris", "oud", "patchouli", "bergamot", "vetiver", "sandalwood",
    "vanilla", "incense", "leather", "smoke", "spice", "citrus", "floral",
    "oriental", "woody", "marine", "aquatic", "gourmand", "chypre",
    "parfum", "parfums", "extrait", "intense", "collection", "edition",
    "limited", "special", "classic", "modern", "extreme", "absolute",
    "rouge", "blanc", "noir", "bleu", "verde", "viola", "rosa",
    "homme", "femme", "pour", "pour", "pour", "pour",
    "scandal", "sinners", "sauvage", "santal", "sandal",
    "guccini", "gucci", // Marka adları
  ]);

  console.log("Şüpheli kelimeler (bağlamla):\n");
  let shown = 0;
  for (const [word] of sorted) {
    if (ENGLISH_WHITELIST.has(word)) continue;
    if (shown > 200) break;
    shown++;
    console.log(`  ${word}`);
  }

  // Birkaç tam açıklama göster
  console.log("\n=== Örnek açıklamalar (hatalı içerebilen) ===");
  const samplesWithIssues = products.filter(p =>
    /\b(guclu|guzel|ozgun|ozgur|siirsel|siklik|coskullu|cikartici|yuksek|seklinde|sekilde|sekildi|sunulan|gunes|gunluk|sunulmak|guzelligi|sikligi|seklinde|cikarticilik)\b/i.test(p.description ?? "")
  ).slice(0, 5);

  for (const p of samplesWithIssues) {
    console.log(`\n--- ${p.name} ---`);
    console.log(p.description?.slice(0, 500));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
