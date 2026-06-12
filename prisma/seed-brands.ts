import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// slug prefix -> display name
const BRAND_MAP: Record<string, string> = {
  "amouage": "Amouage",
  "anfar": "Anfar",
  "armani-prive": "Armani Privé",
  "azzaro": "Azzaro",
  "bottega-veneta": "Bottega Veneta",
  "burberry": "Burberry",
  "bvlgari": "Bvlgari",
  "byredo": "Byredo",
  "calvin-klein": "Calvin Klein",
  "carner-barcelona": "Carner Barcelona",
  "carolina-herrera": "Carolina Herrera",
  "caroline-herrera": "Carolina Herrera",
  "cartier": "Cartier",
  "casamorati": "Casamorati",
  "chloe": "Chloé",
  "christian-dior": "Christian Dior",
  "clive-christian": "Clive Christian",
  "coach": "Coach",
  "creed": "Creed",
  "dior": "Dior",
  "dkny": "DKNY",
  "dolce-gabbana": "Dolce & Gabbana",
  "dunhill": "Dunhill",
  "estee-lauder": "Estée Lauder",
  "ex-nihilo": "Ex Nihilo",
  "frederic-malle": "Frédéric Malle",
  "givenchy": "Givenchy",
  "gisada": "Gisada",
  "gucci": "Gucci",
  "guerlain": "Guerlain",
  "hugo-boss": "Hugo Boss",
  "initio": "Initio",
  "jean-paul-gaultier": "Jean Paul Gaultier",
  "jo-malone": "Jo Malone",
  "jpg": "Jean Paul Gaultier",
  "kajal": "Kajal",
  "kayali": "Kayali",
  "kenzo": "Kenzo",
  "kilian": "Kilian",
  "lacoste": "Lacoste",
  "lancome": "Lancôme",
  "lattafa": "Lattafa",
  "lv": "Louis Vuitton",
  "maison-crivelli": "Maison Crivelli",
  "mancera": "Mancera",
  "marc-antoine-barrois": "Marc-Antoine Barrois",
  "marc-jacobs": "Marc Jacobs",
  "matiere-premiere": "Matière Première",
  "memo": "Memo",
  "mfk": "Maison Francis Kurkdjian",
  "michael-kors": "Michael Kors",
  "michaelkors": "Michael Kors",
  "moschino": "Moschino",
  "montale": "Montale",
  "montblanc": "Montblanc",
  "mugler": "Mugler",
  "narciso-rodriguez": "Narciso Rodriguez",
  "nasomatto": "Nasomatto",
  "orto-parisi": "Orto Parisi",
  "paco-rabanne": "Paco Rabanne",
  "pantheon": "Pantheon Roma",
  "parfums-de-marly": "Parfums de Marly",
  "pdm": "Parfums de Marly",
  "prada": "Prada",
  "roberto-cavalli": "Roberto Cavalli",
  "stephane-humport": "Stéphane Humbert Lucas",
  "tiziana-terenzi": "Tiziana Terenzi",
  "tom-ford": "Tom Ford",
  "valentino": "Valentino",
  "versace": "Versace",
  "viktor-rolf": "Viktor & Rolf",
  "xerjoff": "Xerjoff",
  "ysl": "Yves Saint Laurent",
  "zoologist": "Zoologist",
};

function getBrandSlug(productSlug: string): string | null {
  for (const prefix of Object.keys(BRAND_MAP)) {
    if (productSlug.startsWith(prefix + "-") || productSlug === prefix) {
      return prefix;
    }
  }
  return null;
}

async function main() {
  console.log("Marka seed basliyor...");

  // Tum urunleri al
  const products = await prisma.product.findMany({ where: { deletedAt: null } });
  console.log(`${products.length} urun bulundu`);

  // Hangi markalar kullaniliyor?
  const usedBrands = new Set<string>();
  for (const p of products) {
    const slug = getBrandSlug(p.slug);
    if (slug) usedBrands.add(slug);
  }
  console.log(`${usedBrands.size} marka tespit edildi`);

  // Markalari olustur/guncelle
  const brandIdMap: Record<string, string> = {};
  for (const slug of usedBrands) {
    const name = BRAND_MAP[slug];
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
    brandIdMap[slug] = brand.id;
  }

  // Urunlere marka ata
  let updated = 0;
  for (const p of products) {
    const slug = getBrandSlug(p.slug);
    if (slug && brandIdMap[slug]) {
      await prisma.product.update({ where: { id: p.id }, data: { brandId: brandIdMap[slug] } });
      updated++;
    }
  }

  console.log(`${Object.keys(brandIdMap).length} marka olusturuldu, ${updated} urune marka atandi`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
