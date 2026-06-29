import fs from "fs";
import "dotenv/config";
import slugify from "slugify";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_SOURCE = process.argv[2] ?? "C:\\Users\\serca\\.codex\\attachments\\01f89567-3e98-4965-8183-769a88bd6121\\pasted-text.txt";

const HEADINGS = new Set([
  "ATKINSONS LONDON 1799",
  "BOADICEA THE VICTORIOUS",
  "BOTTEGA VENETA",
  "BURBERRY",
  "BVLGARI",
  "CAROLINA HERRERA",
  "CHANEL",
  "CHLOE",
  "CHRISTIAN DIOR",
  "CLIVE CHRISTIAN",
  "CLUB DE NUIT",
  "CREED",
  "D&G FRUIT COLLECTION",
  "DIOR",
  "DOLCE & GABBANA",
  "ELIE SAAB",
  "EMPORIO ARMANI",
  "FRÉDÉRIC MALLE",
  "GIORGIO ARMANI",
  "GIRITTI",
  "GUCCI",
  "GUERLAIN",
  "HERMÈS",
  "HUGO BOSS",
  "JEAN PAUL GAULTIER",
  "JEROBOAM",
  "JIMMY CHOO",
  "JO MALONE",
  "KAYALI",
  "KENZO",
  "KILIAN",
  "KIRKE",
  "LACOSTE",
  "LANVIN",
  "LATTAFA",
  "MAISON FRANCIS KURKDJIAN",
  "MARC JACOBS",
  "MICHAEL KORS",
  "MICHELE FRANZESE",
  "MONTALE",
  "MORPH",
  "MOSCHINO",
  "NARCISO RODRÍGUEZ",
  "NASOMATTO",
  "NISHANE",
  "ORTO PARISI",
  "PACO RABANNE",
  "PARFUMS DE MARLY",
  "PENHALIGON'S",
  "PERFUMORESQUE",
  "PHILIPP PLEIN",
  "PINO SILVESTRE",
  "PRADA",
  "ROBERTO CAVALLI",
  "ROJA PARFUMS",
  "SALVATORE FERRAGAMO",
  "SHAIK",
  "SOSPIRO",
  "THIERRY MUGLER",
  "THOMAS KOSMALA",
  "TIFFANY & CO",
  "TIZIANA TERENZI",
  "TOM FORD",
  "TOMMY HILFIGER",
  "TRUSSARDI",
  "VALENTINO",
  "VAN CLEEF & ARPELS",
  "VERSACE",
  "VICTORIA'S SECRET",
  "VIKTOR & ROLF",
  "VILHELM PARFUMERIE",
  "XERJOFF",
  "YVES SAINT LAURENT",
  "ZADIG & VOLTAIRE",
  "ZARA",
  "ZOOLOGIST",
]);

const SECTION_TO_BRAND = {
  "ATKINSONS LONDON 1799": "Atkinsons London 1799",
  "BOADICEA THE VICTORIOUS": "Boadicea The Victorious",
  "BOTTEGA VENETA": "Bottega Veneta",
  BURBERRY: "Burberry",
  BVLGARI: "Bvlgari",
  "CAROLINA HERRERA": "Carolina Herrera",
  CHANEL: "Chanel",
  CHLOE: "Chloe",
  "CHRISTIAN DIOR": "Dior",
  "CLIVE CHRISTIAN": "Clive Christian",
  "CLUB DE NUIT": "Armaf",
  CREED: "Creed",
  "D&G FRUIT COLLECTION": "Dolce & Gabbana",
  DIOR: "Dior",
  "DOLCE & GABBANA": "Dolce & Gabbana",
  "ELIE SAAB": "Elie Saab",
  "EMPORIO ARMANI": "Emporio Armani",
  "FRÉDÉRIC MALLE": "Frédéric Malle",
  "GIORGIO ARMANI": "Giorgio Armani",
  GIRITTI: "Gritti",
  GUCCI: "Gucci",
  GUERLAIN: "Guerlain",
  "HERMÈS": "Hermès",
  "HUGO BOSS": "Hugo Boss",
  "JEAN PAUL GAULTIER": "Jean Paul Gaultier",
  JEROBOAM: "Jeroboam",
  "JIMMY CHOO": "Jimmy Choo",
  "JO MALONE": "Jo Malone",
  KAYALI: "Kayali",
  KENZO: "Kenzo",
  KILIAN: "Kilian",
  KIRKE: "Tiziana Terenzi",
  LACOSTE: "Lacoste",
  LANVIN: "Lanvin",
  LATTAFA: "Lattafa",
  "MAISON FRANCIS KURKDJIAN": "Maison Francis Kurkdjian",
  "MARC JACOBS": "Marc Jacobs",
  "MICHAEL KORS": "Michael Kors",
  "MICHELE FRANZESE": "Michele Franzese",
  MONTALE: "Montale",
  MORPH: "Morph",
  MOSCHINO: "Moschino",
  "NARCISO RODRÍGUEZ": "Narciso Rodriguez",
  NASOMATTO: "Nasomatto",
  NISHANE: "Nishane",
  "ORTO PARISI": "Orto Parisi",
  "PACO RABANNE": "Paco Rabanne",
  "PARFUMS DE MARLY": "Parfums de Marly",
  "PENHALIGON'S": "Penhaligon's",
  PERFUMORESQUE: "Perfumoresque",
  "PHILIPP PLEIN": "Philipp Plein",
  "PINO SILVESTRE": "Pino Silvestre",
  PRADA: "Prada",
  "ROBERTO CAVALLI": "Roberto Cavalli",
  "ROJA PARFUMS": "Roja Parfums",
  "SALVATORE FERRAGAMO": "Salvatore Ferragamo",
  SHAIK: "Shaik",
  SOSPIRO: "Sospiro",
  "THIERRY MUGLER": "Mugler",
  "THOMAS KOSMALA": "Thomas Kosmala",
  "TIFFANY & CO": "Tiffany & Co",
  "TIZIANA TERENZI": "Tiziana Terenzi",
  "TOM FORD": "Tom Ford",
  "TOMMY HILFIGER": "Tommy Hilfiger",
  TRUSSARDI: "Trussardi",
  VALENTINO: "Valentino",
  "VAN CLEEF & ARPELS": "Van Cleef & Arpels",
  VERSACE: "Versace",
  "VICTORIA'S SECRET": "Victoria's Secret",
  "VIKTOR & ROLF": "Viktor & Rolf",
  "VILHELM PARFUMERIE": "Vilhelm Parfumerie",
  XERJOFF: "Xerjoff",
  "YVES SAINT LAURENT": "Yves Saint Laurent",
  "ZADIG & VOLTAIRE": "Zadig & Voltaire",
  ZARA: "Zara",
  ZOOLOGIST: "Zoologist",
};

const PREMIUM_BRANDS = new Set([
  "Atkinsons London 1799",
  "Boadicea The Victorious",
  "Clive Christian",
  "Creed",
  "Frédéric Malle",
  "Jeroboam",
  "Kilian",
  "Maison Francis Kurkdjian",
  "Nishane",
  "Orto Parisi",
  "Parfums de Marly",
  "Penhaligon's",
  "Perfumoresque",
  "Roja Parfums",
  "Sospiro",
  "Tiziana Terenzi",
  "Tom Ford",
  "Vilhelm Parfumerie",
  "Xerjoff",
]);

const CATEGORY_LABELS = {
  kadin: "kadın",
  erkek: "erkek",
  unisex: "unisex",
  "ozel-koleksiyon": "özel koleksiyon",
};

const FEMALE_HINTS = [
  "woman", "women", "femme", "femin", "lady", "girl", "her", "mademoiselle",
  "donna", "goddess", "bloom", "blossom", "flower", "rose", "rosa", "gardenia", "magnolia",
  "peony", "iris", "violet", "chloe", "miss", "rouge", "pink", "tease", "bare", "libre",
  "passione", "si ", "si-", "idol", "lune", "nouveau", "love", "love in white", "orchid",
  "adict", "addict", "narciso", "bombshell", "very sexy", "paradoxe", "femme", "body",
];

const MALE_HINTS = [
  "men", "man", "homme", "uomo", "boy", "bad boy", "stronger", "bottled", "invictus",
  "phantom", "wanted", "sauvage", "sport", "legend", "glacial", "rain", "terrae",
  "wood", "oud", "leather", "tobacco", "vetiver", "noir", "carbon", "fury", "night", "blue",
  "eros", "acqua", "allure homme", "hugo", "dhomme", "lhomme", "the one m", "ambero", "tygar",
];

const SPECIAL_HINTS = [
  "unisex", "fleur", "kiss", "silk", "naxos", "oud", "amber", "amber", "baccarat",
  "lumiere", "royal", "limited", "extrait", "parfum", "reserve", "priv", "musk", "morph",
  "kirke", "zoologist", "sospiro", "roja", "memo", "malle", "nishane", "xero", "tom ford",
];

function normalizeText(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "");
}

function normalizeHeading(value) {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function smartTitleCase(raw) {
  const tokens = raw.trim().replace(/\s+/g, " ").split(" ");
  const preserve = new Set([
    "EDP", "EDT", "EDC", "EDV", "ML", "JPG", "YSL", "MFK", "PDM", "LV", "VS", "TF", "CH",
    "D&G", "A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "I.", "K.", "M.", "N.", "O.",
    "P.", "R.", "S.", "T.", "U.", "V.", "W.", "X.", "Y.", "Z.",
  ]);

  return tokens
    .map((token) => {
      const cleaned = token.replace(/[^\p{L}\p{N}&'.-]/gu, "");
      if (!cleaned) return token;
      if (preserve.has(cleaned.toUpperCase())) return cleaned.toUpperCase();
      if (cleaned.includes("&")) return cleaned;
      if (/^\d+$/.test(cleaned)) return cleaned;
      if (/^[A-Z]\.$/.test(cleaned)) return cleaned.toUpperCase();
      if (/^[A-Z]{2,4}$/.test(cleaned) && cleaned.length <= 4) return cleaned.toUpperCase();
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    })
    .join(" ");
}

function brandSlug(name) {
  return slugify(name, { lower: true, strict: true, locale: "tr" });
}

function titleSlug(name) {
  return slugify(name, { lower: true, strict: true, locale: "tr" });
}

function stripLeadingBrand(rawName, brandName) {
  const raw = rawName.trim().replace(/\s+/g, " ");
  const brandWords = brandName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);

  const rawWords = raw.split(" ");
  if (brandWords.length > 0 && rawWords.length > 1) {
    const rawHead = rawWords.slice(0, brandWords.length + 1).join(" ");
    const normalizedRawHead = normalizeText(rawHead);
    const normalizedBrand = normalizeText(brandName);
    if (normalizedRawHead.startsWith(normalizedBrand)) {
      return rawWords.slice(brandWords.length).join(" ");
    }
  }

  const aliasMap = [
    ["Carolina Herrera", ["CH"]],
    ["Bvlgari", ["BVLGARI"]],
    ["Yves Saint Laurent", ["YSL"]],
    ["Jean Paul Gaultier", ["JPG"]],
    ["Tom Ford", ["TF"]],
    ["Victoria's Secret", ["VS"]],
    ["Dolce & Gabbana", ["D&G", "DOLCE", "GABBANA"]],
    ["Emporio Armani", ["EMPORIO", "A."]],
    ["Giorgio Armani", ["GIORGIO", "A."]],
    ["Prada", ["PRADA"]],
    ["Dior", ["DIOR", "CHRISTIAN", "DIOR"]],
  ];

  for (const [brand, aliases] of aliasMap) {
    if (normalizeText(brandName) !== normalizeText(brand)) continue;
    if (aliases.length && rawWords.length > aliases.length) {
      const first = rawWords.slice(0, aliases.length).join(" ").toUpperCase();
      const normalizedFirst = normalizeHeading(first);
      const normalizedAliases = aliases.map((a) => normalizeHeading(a)).join(" ");
      if (normalizedFirst === normalizedAliases || normalizedFirst.startsWith(normalizedAliases)) {
        return rawWords.slice(aliases.length).join(" ");
      }
    }
  }

  return raw;
}

function guessCategory(name, section) {
  const normalized = `${normalizeText(name)} ${normalizeText(section)}`;
  if (normalized.includes("ozelkoleksiyon")) return "ozel-koleksiyon";
  if (FEMALE_HINTS.some((hint) => normalized.includes(normalizeText(hint)))) return "kadin";
  if (MALE_HINTS.some((hint) => normalized.includes(normalizeText(hint)))) return "erkek";
  if (SPECIAL_HINTS.some((hint) => normalized.includes(normalizeText(hint)))) return "unisex";
  if (normalizeText(section) === normalizeText("VICTORIA'S SECRET")) return "kadin";
  if (normalizeText(section) === normalizeText("CHLOE")) return "kadin";
  if (normalizeText(section) === normalizeText("ELIE SAAB")) return "kadin";
  if (normalizeText(section) === normalizeText("TIFFANY & CO")) return "kadin";
  if (normalizeText(section) === normalizeText("HUGO BOSS")) return "erkek";
  if (normalizeText(section) === normalizeText("LACOSTE")) return "erkek";
  if (normalizeText(section) === normalizeText("PINO SILVESTRE")) return "erkek";
  if (normalizeText(section) === normalizeText("JIMMY CHOO")) return "kadin";
  if (normalizeText(section) === normalizeText("JO MALONE")) return "unisex";
  if (normalizeText(section) === normalizeText("KAYALI")) return "unisex";
  if (normalizeText(section) === normalizeText("NARCISO RODRIGUEZ")) return "unisex";
  if (normalizeText(section) === normalizeText("BURBERRY")) return "unisex";
  if (normalizeText(section) === normalizeText("GUCCI")) return "unisex";
  if (normalizeText(section) === normalizeText("PRADA")) return "unisex";
  if (normalizeText(section) === normalizeText("VERSACE")) return "unisex";
  if (normalizeText(section) === normalizeText("VALENTINO")) return "unisex";
  if (normalizeText(section) === normalizeText("YVES SAINT LAURENT")) return "unisex";
  return "unisex";
}

function isPremium(brandName, productName) {
  const nBrand = normalizeText(brandName);
  const nName = normalizeText(productName);
  if (PREMIUM_BRANDS.has(brandName)) return true;
  if (nBrand === normalizeText("Bvlgari") && /legemme|priv(e|é)|royal|limited/.test(nName)) return true;
  if (nBrand === normalizeText("Armani Privé")) return true;
  if (nName.includes("extrait") || nName.includes("private") || nName.includes("reserve") || nName.includes("royal")) return true;
  if (nName.includes("baccarat") || nName.includes("oud")) return true;
  return false;
}

function noteProfile(name) {
  const n = normalizeText(name);
  if (/(rose|rosa|jasmin|jasmine|magnolia|gardenia|peony|violet|iris|blossom|fleur|flower|orchid)/.test(n)) return "floral";
  if (/(oud|wood|cedar|sandal|vetiver|leather|tobacco|musk|amber|incense|smoke|noir|dark)/.test(n)) return "woody";
  if (/(vanilla|vanille|gourmand|cherry|pistachio|honey|tonka|caramel|sugar|candy|milk|biscuit|cream)/.test(n)) return "gourmand";
  if (/(fresh|citrus|cologne|aqua|blue|ocean|marine|bergamot|lemon|mandarin|orange|neroli)/.test(n)) return "fresh";
  if (/(spice|pepper|saffron|cardamom|cinnamon|clove|resin|smoke|bitter|balsamic)/.test(n)) return "spicy";
  return "balanced";
}

function generateDescription(name, brandName, category, premium) {
  const catLabel = CATEGORY_LABELS[category] ?? "unisex";
  const intro = `${name}, ${brandName} koleksiyonunun ${catLabel} yorumudur.`;
  const body = (() => {
    if (category === "kadin") {
      return premium
        ? "Zarif açılış, yumuşak çiçek kalbi ve ipeksi dip notalarla lüks bir iz bırakır. Gün boyu kendini hissettiren, sofistike ve etkileyici bir karakter sunar."
        : "Parlak açılışı, çiçeksi kalbi ve dengeli dip notalarıyla feminen bir imza sunar. Günlük kullanımda da özel anlarda da rahatlıkla tercih edilir.";
    }
    if (category === "erkek") {
      return premium
        ? "Güçlü açılış, odunsu omurga ve derin baharat katmanlarıyla karizmatik bir duruş kurar. Akılda kalan, yoğun ve prestijli bir profil taşır."
        : "Maskülen omurgası, temiz açılışı ve dengeli kalıcı yapısıyla güçlü bir etki bırakır. Modern erkek parfüm çizgisini sade ama belirgin biçimde taşır.";
    }
    if (category === "ozel-koleksiyon") {
      return "Nadir hammaddeler, katmanlı yapı ve koleksiyonluk bir karakter ile öne çıkar. Koku gelişimi boyunca farklı yüzlerini gösteren özel bir imza sunar.";
    }
    return premium
      ? "Dengeli ama yoğun karakteriyle ten üzerinde kişisel bir imzaya dönüşür. Lüks hissi, uzun ömürlü performans ve katmanlı yapı bir araya gelir."
      : "Dengeli yapısı ve kolay taşınan karakteriyle günün her anına uyum sağlar. Modern, temiz ve kalıcı bir koku deneyimi sunar.";
  })();
  const tail = premium
    ? "Premium segmentte konumlanan bu koku, konsantrasyonu ve kalıcılığıyla öne çıkar."
    : "Erişilebilir lüks çizgisinde, temiz ve rahat kullanım odaklı bir koku deneyimi sağlar.";
  return `${intro}\n\n${body} ${tail}`;
}

function generateScentNotes(name, category) {
  const profile = noteProfile(name);
  const notes = {
    floral: {
      top: "Bergamot, mandalina, pembe biber",
      middle: "Gül, yasemin, iris",
      base: "Misk, amber, sandal ağacı",
    },
    woody: {
      top: "Karabiber, bergamot, tütsü",
      middle: "Vetiver, sedir, paçuli",
      base: "Oud, amber, deri",
    },
    gourmand: {
      top: "Pistachio, badem, narenciye",
      middle: "Vanilya, çiçeksi akorlar, tonka",
      base: "Misk, karamel, sandal ağacı",
    },
    fresh: {
      top: "Bergamot, limon, yeşil notalar",
      middle: "Neroli, aromatik akorlar, lavanta",
      base: "Misk, amber, temiz odunsu tonlar",
    },
    spicy: {
      top: "Safran, pembe biber, kakule",
      middle: "Amber, reçine, tütsü",
      base: "Paçuli, oud, misk",
    },
    balanced: {
      top: category === "erkek" ? "Bergamot, karabiber, aromatik notalar" : "Bergamot, meyvemsi akorlar, hafif baharat",
      middle: category === "erkek" ? "Lavanta, sedir, otlar" : "Gül, yasemin, iris",
      base: category === "erkek" ? "Vetiver, amber, misk" : "Misk, vanilya, sandal ağacı",
    },
  };

  const n = notes[profile] ?? notes.balanced;
  return `Üst nota: ${n.top}\nOrta nota: ${n.middle}\nDip nota: ${n.base}`;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const maxLen = Math.max(x.length, y.length);
  return 1 - levenshtein(x, y) / maxLen;
}

function parseSource(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const items = [];
  let currentSection = null;

  for (const line of lines) {
    if (!line) continue;
    if (line.includes("Stoktakilerle eşleşiyor")) continue;
    const heading = normalizeHeading(line);
    if (HEADINGS.has(heading)) {
      currentSection = heading;
      continue;
    }
    if (!currentSection) continue;

    const wordCount = line.split(/\s+/).filter(Boolean).length;
    const normalizedLine = normalizeText(line);
    const looksLikeInstruction =
      wordCount > 20 ||
      line.length > 160 ||
      /[.!?]$/.test(line) ||
      [
        "yukarida",
        "sistemimizdekiler",
        "marka alanlari",
        "stok ekle",
        "fiyatini",
        "yapay zeka",
        "sonra da",
        "guncelle",
        "kisa ve uzun",
      ].some((phrase) => normalizedLine.includes(normalizeText(phrase)));
    if (looksLikeInstruction) continue;

    items.push({
      section: currentSection,
      rawName: line,
    });
  }
  return items;
}

function buildExistingIndexes(products) {
  const bySlug = new Map();
  const byNormName = new Map();
  for (const p of products) {
    bySlug.set(normalizeText(p.slug), p);
    byNormName.set(normalizeText(p.name), p);
  }
  return { bySlug, byNormName };
}

function chooseBestMatch(item, products, brandName) {
  const candidates = [
    item.rawName,
    smartTitleCase(item.rawName),
    stripLeadingBrand(item.rawName, brandName),
    smartTitleCase(stripLeadingBrand(item.rawName, brandName)),
  ].filter(Boolean);

  let best = null;
  let bestScore = 0;
  for (const product of products) {
    const productNames = [product.name, product.slug];
    const brandBoost = product.brand?.name && normalizeText(product.brand.name) === normalizeText(brandName) ? 0.05 : 0;
    for (const candidate of candidates) {
      for (const productName of productNames) {
        const score = similarity(candidate, productName) + brandBoost;
        if (score > bestScore) {
          best = product;
          bestScore = score;
        }
      }
    }
  }

  if (bestScore >= 0.84) return { product: best, score: bestScore };
  return { product: null, score: bestScore };
}

async function ensureBaseCategories() {
  const categories = {
    kadin: {
      name: "Kadın Parfümleri",
      slug: "kadin",
      description: "Feminen, zarif ve baştan çıkarıcı kadın parfümleri",
    },
    erkek: {
      name: "Erkek Parfümleri",
      slug: "erkek",
      description: "Güçlü, maskülen ve etkileyici erkek parfümleri",
    },
    unisex: {
      name: "Unisex",
      slug: "unisex",
      description: "Hem kadın hem erkek için zamansız unisex parfümler",
    },
    "ozel-koleksiyon": {
      name: "Özel Koleksiyon",
      slug: "ozel-koleksiyon",
      description: "Sınırlı sayıda üretilen özel koleksiyon",
    },
  };

  const result = {};
  for (const [key, data] of Object.entries(categories)) {
    result[key] = await prisma.category.upsert({
      where: { slug: data.slug },
      update: { name: data.name, description: data.description },
      create: data,
    });
  }
  return result;
}

async function ensureBrand(name) {
  const slug = brandSlug(name);
  return prisma.brand.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

async function main() {
  if (!fs.existsSync(DEFAULT_SOURCE)) {
    throw new Error(`Source file not found: ${DEFAULT_SOURCE}`);
  }

  const sourceText = fs.readFileSync(DEFAULT_SOURCE, "utf8");
  const importedItems = parseSource(sourceText);
  console.log(`Parsed ${importedItems.length} product rows from source list`);

  const categories = await ensureBaseCategories();
  const activeProducts = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { brand: true, category: true },
  });
  const allProductNos = await prisma.product.findMany({
    select: { productNo: true },
  });
  const { bySlug, byNormName } = buildExistingIndexes(activeProducts);

  const maxNo = allProductNos.reduce((max, product) => {
    if (!product.productNo) return max;
    const n = Number.parseInt(product.productNo.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  let nextNo = maxNo + 1;

  let created = 0;
  let updated = 0;
  let matched = 0;
  let skipped = 0;
  const unmatched = [];
  const brandCache = new Map();

  for (const item of importedItems) {
    const brandName = SECTION_TO_BRAND[item.section] ?? smartTitleCase(item.section);
    const categoryKey = guessCategory(item.rawName, item.section);
    const category = categories[categoryKey] ?? categories.unisex;
    const productName = smartTitleCase(stripLeadingBrand(item.rawName, brandName));
    const productSlug = titleSlug(productName);
    const premium = isPremium(brandName, productName);
    const costPrice = premium ? 1250 : 650;
    const salePrice = premium ? 5000 : 3000;
    const stockIncrement = 10;
    const description = generateDescription(productName, brandName, categoryKey, premium);
    const scentNotes = generateScentNotes(productName, categoryKey);

    let brand = brandCache.get(normalizeText(brandName));
    if (!brand) {
      brand = await ensureBrand(brandName);
      brandCache.set(normalizeText(brandName), brand);
    }

    const exactMatch = bySlug.get(normalizeText(productSlug)) ?? byNormName.get(normalizeText(productName));
    const fuzzyMatch = exactMatch
      ? { product: exactMatch, score: 1 }
      : chooseBestMatch({ rawName: item.rawName }, activeProducts, brandName);
    const target = fuzzyMatch.product;

    if (target) {
      await prisma.product.update({
        where: { id: target.id },
        data: {
          name: productName,
          slug: productSlug,
          description,
          scentNotes,
          price: salePrice,
          costPrice,
          categoryId: category.id,
          brandId: brand.id,
          stock: { increment: stockIncrement },
          deletedAt: null,
          isActive: true,
        },
      });
      matched++;
      updated++;
      continue;
    }

    const createdProduct = await prisma.product.create({
      data: {
        productNo: `PRD-${String(nextNo++).padStart(4, "0")}`,
        name: productName,
        slug: productSlug,
        description,
        scentNotes,
        price: salePrice,
        costPrice,
        categoryId: category.id,
        brandId: brand.id,
        images: [],
        stock: stockIncrement,
        isActive: true,
        isOzelKoleksiyon: categoryKey === "ozel-koleksiyon",
      },
    });
    activeProducts.push({ ...createdProduct, brand, category });
    bySlug.set(normalizeText(productSlug), createdProduct);
    byNormName.set(normalizeText(productName), createdProduct);
    created++;
  }

  console.log("Import complete");
  console.log(`Matched/updated: ${matched}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  if (unmatched.length) {
    console.log("Unmatched items:");
    for (const row of unmatched) console.log(` - ${row.section} :: ${row.rawName}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
