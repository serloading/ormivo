import pg from "pg";
const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});
await client.connect();

// Markasız ürünleri listele
const nobrand = await client.query(`SELECT id, name FROM "Product" WHERE "brandId" IS NULL ORDER BY name`);
console.log(`Markasız ${nobrand.rows.length} ürün:`);
nobrand.rows.forEach(r => console.log(" -", r.name));

// Eksik markaları oluştur
const newBrands = [
  ["Chanel",             "chanel"],
  ["Hermès",             "hermes"],
  ["Victoria's Secret",  "victorias-secret"],
  ["Dunhill",            "dunhill"],
  ["Philipp Plein",      "philipp-plein"],
  ["Zadig & Voltaire",   "zadig-voltaire"],
  ["Armani",             "armani"],
  ["Chanel",             "chanel"],
];

const brandMap = {};
const existing = await client.query(`SELECT id, name FROM "Brand"`);
existing.rows.forEach(r => { brandMap[r.name] = r.id; });

for (const [name, slug] of newBrands) {
  if (!brandMap[name]) {
    const r = await client.query(
      `INSERT INTO "Brand"(id, name, slug, "createdAt", "updatedAt") VALUES(gen_random_uuid()::text,$1,$2,now(),now()) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      [name, slug]
    );
    brandMap[name] = r.rows[0].id;
    console.log("Marka oluşturuldu:", name);
  }
}

// Ürünlere marka ata
const assignments = [
  // prefix → marka adı
  ["Chanel",          "Chanel"],
  ["Hermes",          "Hermès"],
  ["Terre D Hermes",  "Hermès"],
  ["Victorias Secret","Victoria's Secret"],
  ["VS Bare",         "Victoria's Secret"],
  ["Icon Dunhill",    "Dunhill"],
  ["Philipp Plein",   "Philipp Plein"],
  ["Zadig Voltaire",  "Zadig & Voltaire"],
  // Armani ürünleri (Arman/Giorgio Armani/Armani Code/Si vs.)
  ["Arman Stronger",  "Armani"],
  ["Armani Acqua",    "Armani"],
  ["Armani Because",  "Armani"],
  ["Armani Code",     "Armani"],
  ["Armani Si",       "Armani"],
  ["Armani Stronger", "Armani"],
  ["Giorgio Armani",  "Armani"],
  // YSL Black Opium
  ["Black Opium",     "Yves Saint Laurent"],
  // Dior
  ["Dior",            "Dior"],
  ["Miss Dior",       "Dior"],
  ["Rose Eternel",    "Dior"],
  // Lancôme
  ["La Vie Est Belle","Lancôme"],
  // Paco Rabanne
  ["Paco Rabanna",    "Paco Rabanne"],
];

let updated = 0;
for (const [prefix, brandName] of assignments) {
  const bid = brandMap[brandName];
  if (!bid) { console.log("Marka bulunamadı:", brandName); continue; }
  const r = await client.query(
    `UPDATE "Product" SET "brandId"=$1 WHERE "brandId" IS NULL AND name ILIKE $2 RETURNING name`,
    [bid, `${prefix}%`]
  );
  r.rows.forEach(p => console.log(`✓ ${p.name} → ${brandName}`));
  updated += r.rows.length;
}

// Kalan markasız
const remaining = await client.query(`SELECT name FROM "Product" WHERE "brandId" IS NULL ORDER BY name`);
if (remaining.rows.length) {
  console.log(`\nHâlâ markasız ${remaining.rows.length} ürün:`);
  remaining.rows.forEach(r => console.log(" -", r.name));
} else {
  console.log("\n✓ Tüm ürünlerin markası atandı!");
}

await client.end();
