import pg from "pg";
const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const catRes = await client.query(`SELECT id, name FROM "Category"`);
const catMap = {};
catRes.rows.forEach(r => { catMap[r.name] = r.id; });

// [ad içinde geçen kelime, cinsiyet]
const fixes = [
  ["Armani Prive Rouge Malachite", "Unisex"],
  ["Armani Prive Vert Malachite",  "Unisex"],
  ["Le Gemme Ambero",              "Erkek"],
  ["Le Gemme Garanat",             "Unisex"],
  ["Le Gemme Gyan",                "Kadın"],
  ["Le Gemme Tygar",               "Erkek"],
  ["Calvin Klein Be EDT",          "Unisex"],
  ["Calvin Klein Euphoria Men",    "Erkek"],
  ["Calvin Klein One EDT",         "Unisex"],
  ["Christian Dior Gris Dior",     "Unisex"],
  ["Clive Christian 1872",         "Erkek"],
  ["Clive Christian No1",          "Unisex"],
  ["Clive Christian V2",           "Unisex"],
  ["Clive Christian X",            "Unisex"],
  ["Ex Nihilo Fleur Narcoti",      "Kadın"],
  ["Frederic Malle Portrait",      "Kadın"],
  ["Gentlemen Reserve Privee",     "Erkek"],
  ["Gentlemen Society",            "Erkek"],
  ["Hermes Eau Des Merveilles",    "Kadın"],
  ["Initio Musk Therapy",          "Unisex"],
  ["Initio Oud For Greatness",     "Unisex"],
  ["Initio Side Effect",           "Unisex"],
  ["Parfums de Marly Haltane",     "Erkek"],
  ["Dylan Purple",                 "Kadın"],
];

let done = 0;
for (const [namePart, gender] of fixes) {
  const res = await client.query(
    `UPDATE "Product" SET "categoryId"=$1 WHERE name ILIKE $2 RETURNING name`,
    [catMap[gender], `%${namePart}%`]
  );
  res.rows.forEach(r => console.log(`✓ ${r.name} → ${gender}`));
  done += res.rows.length;
}

console.log(`\n✓ ${done} ürün daha güncellendi`);

// Özet
const stats = await client.query(`
  SELECT c.name, COUNT(p.id) as cnt
  FROM "Category" c
  LEFT JOIN "Product" p ON p."categoryId" = c.id
  GROUP BY c.name ORDER BY c.name
`);
console.log("\n=== KATEGORİ DAĞILIMI ===");
stats.rows.forEach(r => console.log(`${r.name}: ${r.cnt}`));

const niche = await client.query(`SELECT COUNT(*) FROM "Product" WHERE "isOzelKoleksiyon"=true`);
console.log(`\nÖzel Koleksiyon işaretli: ${niche.rows[0].count}`);

const noBrand = await client.query(`SELECT COUNT(*) FROM "Product" WHERE "brandId" IS NULL`);
const noCat   = await client.query(`SELECT COUNT(*) FROM "Product" WHERE "categoryId" IS NULL`);
console.log(`Markasız: ${noBrand.rows[0].count} | Kategorisiz: ${noCat.rows[0].count}`);

await client.end();
