import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});
await client.connect();

// ── 1. KATEGORİLERİ OKU / OLUŞTUR ───────────────────────────────
const catRes = await client.query(`SELECT id, name FROM "Category"`);
const catMap = {};
catRes.rows.forEach(r => { catMap[r.name] = r.id; });
console.log("Mevcut kategoriler:", Object.keys(catMap));

for (const [name, slug] of [["Kadın","kadin"],["Erkek","erkek"],["Unisex","unisex"]]) {
  if (!catMap[name]) {
    const r = await client.query(
      `INSERT INTO "Category"(id, name, slug, "createdAt", "updatedAt") VALUES(gen_random_uuid()::text,$1,$2,now(),now()) RETURNING id`,
      [name, slug]
    );
    catMap[name] = r.rows[0].id;
    console.log("Oluşturuldu:", name, catMap[name]);
  }
}

// ── 2. MARKALARI OKU ─────────────────────────────────────────────
const brandRes = await client.query(`SELECT id, name FROM "Brand"`);
const brandMap = {};
brandRes.rows.forEach(r => { brandMap[r.name] = r.id; });

// ── 3. TÜM ÜRÜNLERİ OKU ─────────────────────────────────────────
const prodRes = await client.query(`SELECT id, name, "brandId" FROM "Product" ORDER BY name`);
const products = prodRes.rows;
console.log(`\n${products.length} ürün işlenecek...\n`);

// ── 4. MARKA EŞLEŞTİRMELERİ ─────────────────────────────────────
// Ürün adı prefix → marka adı
const brandByPrefix = [
  ["212 Men", "Carolina Herrera"],
  ["212 Vip", "Carolina Herrera"],
  ["Amouage", "Amouage"],
  ["Anfar", "Anfar"],
  ["Arman Stronger", "Armani"],
  ["Armani Acqua", "Armani"],
  ["Armani Because", "Armani"],
  ["Armani Code", "Armani"],
  ["Armani My Way", "Armani"],
  ["Armani Prive", "Armani Privé"],
  ["Armani Si", "Armani"],
  ["Armani Stronger", "Armani"],
  ["Giorgio Armani", "Armani"],
  ["Azzaro", "Azzaro"],
  ["Black Opium", "Yves Saint Laurent"],
  ["Burberry", "Burberry"],
  ["My Burberry", "Burberry"],
  ["Bvlgari", "Bvlgari"],
  ["Byredo", "Byredo"],
  ["Calvin Klein", "Calvin Klein"],
  ["Carner Barcelona", "Carner Barcelona"],
  ["Carolina Herrera", "Carolina Herrera"],
  ["Caroline Herrera", "Carolina Herrera"],
  ["Cartier", "Cartier"],
  ["Casamorati", "Casamorati"],
  ["Chanel", "Chanel"],
  ["Chloe", "Chloé"],
  ["Christian Dior", "Christian Dior"],
  ["Clive Christian", "Clive Christian"],
  ["Creed", "Creed"],
  ["Dior", "Dior"],
  ["DKNY", "DKNY"],
  ["Dolce Gabbana", "Dolce & Gabbana"],
  ["Estee Lauder", "Estée Lauder"],
  ["Ex Nihilo", "Ex Nihilo"],
  ["Frederic Malle", "Frédéric Malle"],
  ["Gisada", "Gisada"],
  ["Givenchy", "Givenchy"],
  ["Gucci", "Gucci"],
  ["Guerlain", "Guerlain"],
  ["Hermes", "Hermès"],
  ["Terre D Hermes", "Hermès"],
  ["Hugo Boss", "Hugo Boss"],
  ["Icon Dunhill", "Dunhill"],
  ["Initio", "Initio"],
  ["Jo Malone", "Jo Malone"],
  ["JPG", "Jean Paul Gaultier"],
  ["Kajal", "Kajal"],
  ["Kayali", "Kayali"],
  ["Kenzo", "Kenzo"],
  ["Kilian", "Kilian"],
  ["La Vie Est Belle", "Lancôme"],
  ["Lacoste", "Lacoste"],
  ["Lancome", "Lancôme"],
  ["Lattafa", "Lattafa"],
  ["Lattafe", "Lattafa"],
  ["LV ", "Louis Vuitton"],
  ["Maison Crivelli", "Maison Crivelli"],
  ["Mancera", "Mancera"],
  ["Marc Antoine Barrois", "Marc-Antoine Barrois"],
  ["Marc Jacobs", "Marc Jacobs"],
  ["Matiere Premiere", "Matière Première"],
  ["Memo ", "Memo"],
  ["MFK", "Maison Francis Kurkdjian"],
  ["Michael Kors", "Michael Kors"],
  ["Miss Dior", "Dior"],
  ["Montale", "Montale"],
  ["Montblanc", "Montblanc"],
  ["Moschino", "Moschino"],
  ["Mugler", "Mugler"],
  ["Narciso Rodriguez", "Narciso Rodriguez"],
  ["Nasomatto", "Nasomatto"],
  ["Orto Parisi", "Orto Parisi"],
  ["Paco Rabanne", "Paco Rabanne"],
  ["Paco Rabanna", "Paco Rabanne"],
  ["Pantheon", "Pantheon Roma"],
  ["Parfums de Marly", "Parfums de Marly"],
  ["PDM", "Parfums de Marly"],
  ["Philipp Plein", "Philipp Plein"],
  ["Prada", "Prada"],
  ["Roberto Cavalli", "Roberto Cavalli"],
  ["Rose Eternel", "Dior"],
  ["Stephane Humport", "Stéphane Humbert Lucas"],
  ["Tiziana Terenzi", "Tiziana Terenzi"],
  ["Tom Ford", "Tom Ford"],
  ["Valentino", "Valentino"],
  ["Versace", "Versace"],
  ["Victorias Secret", "Victoria's Secret"],
  ["Viktor Rolf", "Viktor & Rolf"],
  ["VS Bare", "Victoria's Secret"],
  ["Xerjoff", "Xerjoff"],
  ["YSL", "Yves Saint Laurent"],
  ["Zadig Voltaire", "Zadig & Voltaire"],
  ["Zoologist", "Zoologist"],
];

// ── 5. CİNSİYET KURALLARI ────────────────────────────────────────
// [anahtar kelime (küçük harf), cinsiyet]  — daha spesifik olanlar üstte
const genderRules = [
  // ── ERKEK ──
  ["212 men", "Erkek"],
  ["212 vip black", "Erkek"],
  ["212 sexy men", "Erkek"],
  ["acqua di gio", "Erkek"],
  ["stronger with you", "Erkek"],
  ["armani code", "Erkek"],
  ["azzaro", "Erkek"],
  ["bvlgari man", "Erkek"],
  ["bvlgari aqva", "Erkek"],
  ["bad boy", "Erkek"],
  ["bleu de chanel", "Erkek"],
  ["allure homme", "Erkek"],
  ["platinum egoiste", "Erkek"],
  ["de bleu pour homme", "Erkek"],
  ["de bleu lexclusif", "Erkek"],
  ["creed aventus 100ml", "Erkek"],
  ["silver mountain water", "Erkek"],
  ["dior fahrenheit", "Erkek"],
  ["dior homme", "Erkek"],
  ["dior sauvage", "Erkek"],
  ["dkny be delicious", "Unisex"],
  ["dolce gabbana k ", "Erkek"],
  ["dolce gabbana light blue viler", "Erkek"],
  ["dolce gabbana the one for men", "Erkek"],
  ["dolce gabbana vib3", "Erkek"],
  ["gentleman", "Erkek"],
  ["givenchy pi", "Erkek"],
  ["pour homme", "Erkek"],
  ["gucci guilty edt ", "Erkek"],
  ["gucci guilty edt pour homme", "Erkek"],
  ["gucci guilty elixir pour homme", "Erkek"],
  ["hugo boss", "Erkek"],
  ["icon dunhill", "Erkek"],
  ["invictus", "Erkek"],
  ["jpg le male", "Erkek"],
  ["jpg fleur du male", "Erkek"],
  ["jpg scandal edt pour homme", "Erkek"],
  ["jpg ultra male", "Erkek"],
  ["jpg le beau", "Erkek"],
  ["kenzo homme", "Erkek"],
  ["kenzo leaupar", "Erkek"],
  ["lacoste l 12 12", "Erkek"],
  ["lacoste original", "Erkek"],
  ["man edt", "Erkek"],
  ["man edp", "Erkek"],
  ["man ], for men", "Erkek"],
  ["montblanc explorer", "Erkek"],
  ["paco rabanne one million", "Erkek"],
  ["paco rabanne phantom", "Erkek"],
  ["prada lhomme", "Erkek"],
  ["prada black", "Erkek"],
  ["prada luna rossa", "Erkek"],
  ["terre d hermes", "Erkek"],
  ["valentino uomo", "Erkek"],
  ["versace eros edt", "Erkek"],
  ["versace eros edp", "Erkek"],
  ["versace eros flame", "Erkek"],
  ["versace eros energy", "Erkek"],
  ["versace eros najim", "Erkek"],
  ["versace eau fraiche", "Erkek"],
  ["versace man", "Erkek"],
  ["versace dylan blue", "Erkek"],
  ["viktor rolf spice bomb", "Erkek"],
  ["ysl lhomme", "Erkek"],
  ["ysl y edp", "Erkek"],
  ["ysl myslf", "Erkek"],
  ["ysl tuxedo", "Erkek"],
  ["zadig voltaire this is him", "Erkek"],
  ["philipp plein", "Erkek"],
  ["gisada ambassador for men", "Erkek"],
  ["gisada titanium", "Erkek"],
  ["kenzo homme sport", "Erkek"],
  ["michael kors pour homme", "Erkek"],
  ["prada ocean", "Erkek"],
  ["hermes marguile", "Erkek"],
  ["hermes barenia", "Erkek"],
  ["burberry hero", "Erkek"],
  ["carolina herrera new york bad boy", "Erkek"],
  ["carolina herrera bad boy", "Erkek"],
  ["carolina herrera 212 sexy men", "Erkek"],
  ["casamorati mefisto", "Erkek"],
  ["casamorati 1888", "Erkek"],
  ["jpg scandal edt pour homme", "Erkek"],
  ["boss bottled", "Erkek"],
  ["boss man", "Erkek"],
  ["boss parfum edition", "Erkek"],
  ["boss the scent", "Erkek"],
  ["boss triumph", "Erkek"],
  ["montblanc signature", "Erkek"],

  // ── KADIN ──
  ["armani my way", "Kadın"],
  ["armani because its you", "Kadın"],
  ["armani si ", "Kadın"],
  ["armani si edp", "Kadın"],
  ["my way", "Kadın"],
  ["because its you", "Kadın"],
  ["burberry for women", "Kadın"],
  ["burberry goddess", "Kadın"],
  ["burberry her", "Kadın"],
  ["burberry my burberry", "Kadın"],
  ["my burberry", "Kadın"],
  ["bvlgari omnia", "Kadın"],
  ["bvlgari rose goldea", "Kadın"],
  ["calvin klein euphoria women", "Kadın"],
  ["calvin klein sheer beauty", "Kadın"],
  ["carolina herrera 212 nyc", "Kadın"],
  ["carolina herrera 212 rose", "Kadın"],
  ["carolina herrera 212 sexy edp", "Kadın"],
  ["212 sexy edp", "Kadın"],
  ["carolina herrera good girl", "Kadın"],
  ["carolina herrera la bomba", "Kadın"],
  ["carolina herrera la bomb", "Kadın"],
  ["blush elixir", "Kadın"],
  ["iris empire", "Kadın"],
  ["cartier la panthere", "Kadın"],
  ["casamorati bouquet ideale", "Kadın"],
  ["casamorati la tosca", "Kadın"],
  ["casamorati lira", "Kadın"],
  ["chanel allure edp", "Kadın"],
  ["chanel chance", "Kadın"],
  ["chanel coco mademoiselle", "Kadın"],
  ["chloe", "Kadın"],
  ["dior hypnotic", "Kadın"],
  ["dior jadore", "Kadın"],
  ["miss dior", "Kadın"],
  ["dolce gabbana devotion", "Kadın"],
  ["dolce gabbana light blue edt", "Kadın"],
  ["dolce gabbana the only one", "Kadın"],
  ["dolce gabbana intense edp", "Kadın"],
  ["estee lauder", "Kadın"],
  ["givenchy irresistible", "Kadın"],
  ["givenchy linterdit", "Kadın"],
  ["gucci bloom", "Kadın"],
  ["gucci flora", "Kadın"],
  ["gucci bamboo", "Kadın"],
  ["guerlain rose cherie", "Kadın"],
  ["jpg classqiue", "Kadın"],
  ["jpg scandal 80ml", "Kadın"],
  ["jpg scandal absolu", "Kadın"],
  ["jpg scandal le parfum", "Kadın"],
  ["jpg la belle", "Kadın"],
  ["jpg gaultier divine", "Kadın"],
  ["kenzo jungle", "Kadın"],
  ["lacoste pour femme", "Kadın"],
  ["lancôme", "Kadın"],
  ["lancome", "Kadın"],
  ["la vie est belle", "Kadın"],
  ["marc jacobs decadence", "Kadın"],
  ["michael kors pour femme", "Kadın"],
  ["moschino toy 2", "Kadın"],
  ["mugler alien", "Kadın"],
  ["mugler angel", "Kadın"],
  ["narciso rodriguez", "Kadın"],
  ["paco rabanne fame", "Kadın"],
  ["paco rabanne lady million", "Kadın"],
  ["paco rabanne olympea", "Kadın"],
  ["paco rabanne one million gold for her", "Kadın"],
  ["paco rabanne one million gold pure jasmine", "Kadın"],
  ["pdm delina", "Kadın"],
  ["pdm valaya", "Kadın"],
  ["pdm palatine", "Kadın"],
  ["prada paradigme", "Kadın"],
  ["prada paradoxe", "Kadın"],
  ["roberto cavalli florence", "Kadın"],
  ["valentino donna", "Kadın"],
  ["valentino voce viva", "Kadın"],
  ["versace bright crystal", "Kadın"],
  ["versace crystal noir", "Kadın"],
  ["versace crystal emerald", "Kadın"],
  ["versace dylan purple", "Kadın"],
  ["versace eros pour femme", "Kadın"],
  ["viktor rolf flower bomb", "Kadın"],
  ["viktor rolf bonbon", "Kadın"],
  ["ysl black opium", "Kadın"],
  ["black opium", "Kadın"],
  ["ysl libre", "Kadın"],
  ["ysl mon edp", "Kadın"],
  ["ysl supreme bouquet", "Kadın"],
  ["ysl babycat", "Kadın"],
  ["ysl love", "Kadın"],
  ["zadig voltaire this is her", "Kadın"],
  ["victorias secret", "Kadın"],
  ["vs bare", "Kadın"],
  ["gisada ambassador for women", "Kadın"],
  ["rose eternel", "Kadın"],
  ["gucci guilty edt", "Unisex"], // overridden below for men
  ["dolce gabbana light blue", "Unisex"],
  ["kilian princess", "Kadın"],
  ["kilian born to be unforgettable", "Kadın"],
  ["pdm greenley", "Erkek"],
  ["pdm percival", "Erkek"],
  ["pdm godolphin", "Erkek"],
  ["pdm herof", "Erkek"],
  ["pdm kalan", "Erkek"],
  ["pdm haltane", "Erkek"],
  ["pdm althair", "Erkek"],
  ["parfums de marly pegasus", "Erkek"],
  ["parfums de marly galloway", "Erkek"],
  ["parfums de marly layton", "Erkek"],
  ["pdm layton", "Erkek"],
  ["creed aventus for her", "Kadın"],
  ["creed jullime vanille", "Kadın"],
];

// ── 6. NİŞ MARKA LİSTESİ ────────────────────────────────────────
const nicheBrands = new Set([
  "Amouage","Anfar","Armani Privé","Byredo","Carner Barcelona","Casamorati",
  "Clive Christian","Creed","Ex Nihilo","Frédéric Malle","Initio","Jo Malone",
  "Kajal","Kayali","Kilian","Lattafa","Louis Vuitton","Maison Crivelli",
  "Maison Francis Kurkdjian","Mancera","Marc-Antoine Barrois","Matière Première",
  "Memo","Montale","Nasomatto","Orto Parisi","Pantheon Roma","Parfums de Marly",
  "Stéphane Humbert Lucas","Tiziana Terenzi","Tom Ford","Xerjoff","Zoologist",
  "Hermès","Guerlain",
]);

// Bvlgari Le Gemme = niş
function isNiche(name, brandName) {
  if (nicheBrands.has(brandName)) return true;
  if (name.includes("Le Gemme")) return true;
  if (name.includes("Armani Prive")) return true;
  return false;
}

// ── 7. HER ÜRÜNÜ İŞLE ───────────────────────────────────────────
let updated = 0;
let noGender = [];

for (const p of products) {
  const nameLower = p.name.toLowerCase();

  // Marka bul
  let brandId = p.brandId;
  if (!brandId) {
    for (const [prefix, bname] of brandByPrefix) {
      if (p.name.startsWith(prefix)) {
        brandId = brandMap[bname] ?? null;
        break;
      }
    }
  }

  // Mevcut marka adı (lookup için)
  const existingBrand = brandRes.rows.find(b => b.id === brandId);
  const brandName = existingBrand?.name ?? "";

  // Cinsiyet bul
  let gender = null;
  for (const [kw, g] of genderRules) {
    if (nameLower.includes(kw.toLowerCase())) {
      gender = g;
      break;
    }
  }

  // Fallback: marka bazlı cinsiyet
  if (!gender) {
    const unisexBrands = [
      "Amouage","Byredo","Carner Barcelona","Jo Malone","Kajal","Kayali",
      "Lattafa","Louis Vuitton","Mancera","Marc-Antoine Barrois","Matière Première",
      "Maison Francis Kurkdjian","Maison Crivelli","Memo","Montale","Nasomatto",
      "Orto Parisi","Pantheon Roma","Stéphane Humbert Lucas","Tiziana Terenzi",
      "Tom Ford","Xerjoff","Zoologist","Hermès","Kilian","Anfar","Guerlain",
    ];
    if (unisexBrands.includes(brandName)) gender = "Unisex";
  }

  const categoryId = gender ? catMap[gender] : null;
  const isNiş = isNiche(p.name, brandName);

  if (!gender) noGender.push(p.name);

  // DB'yi güncelle
  await client.query(
    `UPDATE "Product" SET "brandId"=$1, "categoryId"=$2, "isOzelKoleksiyon"=$3 WHERE id=$4`,
    [brandId || p.brandId, categoryId, isNiş, p.id]
  );
  updated++;
  if (updated % 50 === 0) console.log(`  ${updated}/${products.length} işlendi...`);
}

console.log(`\n✓ ${updated} ürün güncellendi`);
if (noGender.length) {
  console.log(`\nCinsiyet atanamayan ${noGender.length} ürün:`);
  noGender.forEach(n => console.log(" -", n));
}

await client.end();
