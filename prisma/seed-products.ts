import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Fiyat tespiti ────────────────────────────────────────────────────────────
const LUXURY_PREFIXES = [
  "amouage-", "byredo-", "carner-barcelona-", "casamorati-", "clive-christian-",
  "creed-", "ex-nihilo-", "frederic-malle-", "initio-", "jo-malone-", "kajal-",
  "kilian-", "lv-", "maison-crivelli-", "mancera-", "marc-antoine-barrois-",
  "matiere-premiere-", "memo-", "mfk-", "nasomatto-", "orto-parisi-",
  "pantheon-", "parfums-de-marly-", "pdm-", "stephane-humport-",
  "tiziana-terenzi-", "tom-ford-", "xerjoff-", "zoologist-",
  "armani-prive-", "bvlgari-le-gemme-",
];

function isLuxury(slug: string): boolean {
  return LUXURY_PREFIXES.some((p) => slug.startsWith(p));
}

// ── Kategori tespiti ─────────────────────────────────────────────────────────
const NICHE_PREFIXES = [
  "clive-christian-", "nasomatto-", "orto-parisi-", "pantheon-", "zoologist-",
  "frederic-malle-", "marc-antoine-barrois-", "matiere-premiere-",
  "stephane-humport-", "armani-prive-", "bvlgari-le-gemme-",
];

const UNISEX_PREFIXES = [
  "byredo-", "carner-barcelona-", "casamorati-", "jo-malone-", "kayali-",
  "mfk-", "lattafa-", "memo-", "xerjoff-", "tiziana-terenzi-",
  "maison-crivelli-", "mancera-", "initio-", "kilian-", "ex-nihilo-",
  "montale-", "anfar-",
];

const WOMEN_KEYWORDS = [
  "femme", "women", "-lady", "-girl", "-miss", "mademoiselle",
  "for-her", "voce-viva", "linterdit", "irresistible", "olympea", "-fame",
  "black-opium", "-libre", "-donna", "la-belle", "scandal", "jadore",
  "hypnotic", "bloom", "-chance", "allure-edp", "coco-mademoiselle",
  "chloe-", "nomade", "bamboo", "idole", "tresor", "la-vie", "la-nuit",
  "pour-femme", "for-women", "because-its-you", "si-edp", "si-fiori",
  "si-passione", "good-girl", "la-bomba", "la-panthere", "rose-goldea",
  "omnia", "devotion", "the-only-one", "vib3", "modern-muse", "alien",
  "angel-", "flower-bomb", "bonbon", "fleur-narcoti", "portrait-of-a-lady",
  "gaultier-divine", "bombshell", "vs-bare", "bright-crystal", "crystal-noir",
  "crystal-emerald", "dylan-purple", "gorgeous-jasmine", "gorgeous-magnolia",
  "gorgeous-orchid", "blush-elixir", "iris-empire", "peony", "orange-blossom",
  "english-pear", "dark-amber", "scarlet-poppy", "myrrh-tonka", "wood-sage",
  "blackberry-bay", "-mon-", "yum-", "vanilla-28", "sweet-diamond",
  "lovefest", "ysl-love", "attrape-reves", "attrape-reyes", "lvovers",
  "pacific-chill", "cactus-garden", "afternoon-swim", "blue-talisman",
  "asad-zanzibar", "yara", "khamrah", "jihan", "joorie", "lamar-", "warde",
  "elixir-11", "eden-juicy", "oudgasm", "candy-rock", "yum-boujee",
  "yum-pistacho", "pistachio-kunafa", "burberry-goddess", "burberry-her",
  "burberry-for-women", "my-burberry", "burberry-my-burberry",
  "narciso-rodriguez", "lancome-", "estee-lauder", "mugler-alien",
  "mugler-angel", "viktor-rolf-flower", "viktor-rolf-bonbon", "moschino-",
  "marc-jacobs-decadence", "roberto-cavalli", "valentino-donna",
  "valentino-voce", "dkny-", "carolina-herrera-good-girl",
  "carolina-herrera-la-bomba", "caroline-herrera-blush",
  "caroline-herrera-iris", "cartier-la-panthere", "gucci-bloom",
  "gucci-flora", "gucci-bamboo", "prada-paradigme", "prada-paradoxe",
  "la-vie-est-belle", "la-nuit-tresor", "lancome-tresor", "lancome-poeme",
  "christian-dior-gris", "michaelkors-pour-femme", "michael-kors-pour-femme",
  "gisada-ambassador-for-women", "guerlain-rose",
];

const MEN_KEYWORDS = [
  "pour-homme", "for-men", "-homme-", "-uomo", "gentleman", "ultra-male",
  "le-male", "le-beau", "fleur-du-male", "invictus", "one-million", "phantom",
  "wanted", "sauvage", "fahrenheit", "bleu-de", "de-bleu-", "acqua-di-gio",
  "stronger", "code-edt", "code-absolu", "code-cashmere", "code-elixir",
  "lhomme", "bottled", "the-scent", "explorer-", "legend-", "aqva",
  "man-black", "man-glacial", "man-rain", "man-terrae", "man-wood",
  "silver-mountain", "aventus", "luna-rossa", "y-edp", "myslf", "-k-edp",
  "the-one-for-men", "light-blue-edt", "pi-edt", "bad-boy", "figment",
  "guidance", "honour-men", "interlude", "outlands", "amouage-reflection",
  "vip-black", "spice-bomb", "dylan-blue", "eros-edp", "eros-energy",
  "eros-flame", "eros-najim", "allure-homme", "platinum-egoiste",
  "dior-homme", "lhomme-edt", "lhomme-intense", "lhomme-leau",
  "luna-rossa-carbon", "luna-rossa-eau", "luna-rossa-ocean", "prada-luna",
  "barenia", "marguile", "terre-d-hermes", "dunhill", "hugo-boss",
  "montblanc-", "kenzo-homme", "lacoste-l-12", "lacoste-original",
  "212-men", "212-vip", "212-sexy-men", "prada-lhomme", "prada-black",
  "givenchy-gentleman", "givenchy-pi", "givenchy-pour-homme",
  "acqua-di-gio-profumo", "gio-absolu", "azzaro", "tobacco-honey",
  "guerlain-tobacco", "guerlain-cherry", "calvin-klein-euphoria-men",
  "gisada-ambassador-for-men", "gisada-titanium", "michael-kors-pour-homme",
  "givenchy-pour-homme", "hugo-boss-man", "hugo-boss-bottled",
  "hugo-boss-the-scent", "hugo-boss-parfum", "bvlgari-man", "bvlgari-aqva",
  "gucci-guilty-edt", "gucci-guilty-elixir", "dolce-gabbana-k",
  "dolce-gabbana-the-one-for-men", "dolce-gabbana-light-blue-edt",
  "casamorati-mefisto", "paco-rabanne-invictus", "paco-rabanne-one-million",
  "paco-rabanne-phantom", "versace-eros", "versace-man-", "versace-pour-homme",
  "viktor-rolf-spice", "ysl-lhomme", "ysl-myslf", "ysl-y-edp",
  "carolina-herrera-bad-boy", "carolina-herrera-new-york-bad-boy",
  "carolina-herrera-212-nyc", "carolina-herrera-212-sexy-men",
  "dior-sauvage", "dior-fahrenheit",
];

type Cat = "kadin" | "erkek" | "unisex" | "ozel-koleksiyon";

function getCategory(slug: string): Cat {
  if (NICHE_PREFIXES.some((n) => slug.startsWith(n))) return "ozel-koleksiyon";
  if (UNISEX_PREFIXES.some((b) => slug.startsWith(b))) return "unisex";
  if (WOMEN_KEYWORDS.some((k) => slug.includes(k))) return "kadin";
  if (MEN_KEYWORDS.some((k) => slug.includes(k))) return "erkek";
  return "unisex";
}

// ── İsim formatı ─────────────────────────────────────────────────────────────
const WORD_MAP: Record<string, string> = {
  edp: "EDP", edt: "EDT", edc: "EDC", edv: "EDV",
  ml: "ml", ysl: "YSL", lv: "LV", mfk: "MFK", pdm: "PDM",
  jpg: "JPG", vs: "VS", dkny: "DKNY",
  "100ml": "100ml", "75ml": "75ml", "90ml": "90ml", "80ml": "80ml",
  "50ml": "50ml", "125ml": "125ml", "30ml": "30ml", "60ml": "60ml",
  "70ml": "70ml",
  de: "de", du: "du", la: "La", le: "Le", les: "Les",
  ef: "EF", eau: "Eau",
  "1": "1", "2": "2", "46": "46", "48": "48", "724": "724",
  "540": "540", "01": "01", "11": "11", "25": "25", "28": "28",
  "33": "33", "36": "36", "42": "42", "81": "81",
};

function formatName(slug: string): string {
  return slug
    .split("-")
    .map((w) => {
      const lower = w.toLowerCase();
      if (WORD_MAP[lower] !== undefined) return WORD_MAP[lower];
      if (/^\d+$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

// ── Ana fonksiyon ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Ürün seed başlıyor...");

  // Kategorileri al
  const cats = await prisma.category.findMany();
  const catMap: Record<string, string> = {};
  for (const c of cats) catMap[c.slug] = c.id;

  // Eksik kategorileri oluştur
  const needed: Record<string, string> = {
    kadin: "Kadın Parfümleri",
    erkek: "Erkek Parfümleri",
    unisex: "Unisex",
    "ozel-koleksiyon": "Özel Koleksiyon",
  };
  for (const [slug, name] of Object.entries(needed)) {
    if (!catMap[slug]) {
      const c = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { slug, name },
      });
      catMap[slug] = c.id;
    }
  }

  // Görselleri tara
  const uploadsDir = path.join(__dirname, "..", "public", "uploads");
  const imageFiles = fs
    .readdirSync(uploadsDir)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

  console.log(`📁 ${imageFiles.length} görsel bulundu`);

  let created = 0;
  let skipped = 0;

  for (const file of imageFiles) {
    const slug = file.replace(/\.(jpg|jpeg|png|webp)$/i, "");
    const name = formatName(slug);
    const catSlug = getCategory(slug);
    const luxury = isLuxury(slug);
    const price = luxury ? 4000 : 2500;
    const costPrice = luxury ? 1000 : 750;

    try {
      await prisma.product.upsert({
        where: { slug },
        update: {
          name,
          price,
          costPrice,
          categoryId: catMap[catSlug],
          images: [`/uploads/${file}`],
        },
        create: {
          slug,
          name,
          price,
          costPrice,
          categoryId: catMap[catSlug],
          images: [`/uploads/${file}`],
          stock: 10,
          isActive: true,
        },
      });
      created++;
    } catch (e) {
      console.error(`❌ ${slug}:`, e);
      skipped++;
    }
  }

  console.log(`✅ ${created} ürün oluşturuldu/güncellendi, ${skipped} atlandı`);
}

main()
  .catch((e) => { console.error("❌ Hata:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
