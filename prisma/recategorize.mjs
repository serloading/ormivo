import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Ürün adı → hedef kategori slug'ı
const MAP = {
  // ─── KADIN ───────────────────────────────────────────────────────────────
  "Amouage Love Delight":                   "kadin",
  "Amouage Lustre":                         "kadin",
  "Armani My Way Edition Nacre EDP":        "kadin",
  "Armani My Way Intense EDP":              "kadin",
  "Bvlgari Le Gemme Garanat":              "kadin",
  "Calvin Klein Sheer Beauty":              "kadin",
  "Calvin Klein Sheer Beauty Essence":      "kadin",
  "Carolina Herrera 212 Rose EDP 80ml":     "kadin",
  "Casamorati Bouquet Ideale":              "kadin",
  "Casamorati La Tosca":                    "kadin",
  "Casamorati Lira EDP 100ml":              "kadin",
  "Dolce Gabbana Intense EDP 100ml":        "kadin",
  "Dolce Gabbana Light Blue Viler":         "kadin",
  "Ex Nihilo Fleur Narcoti EDP 100ml":      "kadin",
  "Frederic Malle Portrait Of A Lady":      "kadin",
  "Hermes Eau Des Merveilles Bleue":        "kadin",
  "JPG Classqiue":                          "kadin",
  "Kayali Eden Juicy Apple 01":             "kadin",
  "Kayali Lovefest Burning Cherry 48":      "kadin",
  "Kayali Sweet Diamond Pink Pepper 25":    "kadin",
  "Kayali Vanilla Candy Rock Sugar 42":     "kadin",
  "Kayali Yum Boujee Marshmallow 81":       "kadin",
  "Kayali Yum Pistacho Gelato 33":          "kadin",
  "Kenzo Jungle EDP":                       "kadin",
  "Kilian Born To Be Unforgettable":        "kadin",
  "Kilian Born To Be Unforgettable EDP 50ml": "kadin",
  "Kilian Princess":                        "kadin",
  "Lattafa Yara Moi":                       "kadin",
  "Lattafa Yara Pink":                      "kadin",
  "Lattafa Yara Tous":                      "kadin",
  "PDM Delina 75ml":                        "kadin",
  "PDM Delina Exclusif EDP 75ml":           "kadin",
  "PDM Palatine EDP 75ml":                  "kadin",
  "PDM Valaya Exclusif EDP 75ml":           "kadin",
  "Stephane Humport Pink Boa":              "kadin",
  "Stephane Humport Venom Incarnat":        "kadin",
  "Tom Ford Metallique":                    "kadin",
  "Tom Ford Velvet Orchid":                 "kadin",
  "Tom Ford Rose Exposed":                  "kadin",
  "Tom Ford Vanilla Fatale":                "kadin",
  "Xerjoff Erba Gold":                      "kadin",
  "YSL Babycat Accord Daim Vanille":        "kadin",
  "YSL Supreme Bouquet":                    "kadin",
  "Zadig Voltaire This Is Her EDP 100ml":   "kadin",
  "Kenzo Leaupar 100ml":                    "kadin",

  // ─── ERKEK ───────────────────────────────────────────────────────────────
  "Amouage Reasons":                        "erkek",
  "Bvlgari Le Gemme Ambero":               "erkek",
  "Bvlgari Le Gemme Gyan":                 "erkek",
  "Bvlgari Le Gemme Tygar":               "erkek",
  "Casamorati 1888":                        "erkek",
  "Casamorati Mefisto":                     "erkek",
  "Clive Christian 1872":                   "erkek",
  "Clive Christian No1":                    "erkek",
  "Clive Christian V2":                     "erkek",
  "Clive Christian X":                      "erkek",
  "Givenchy Gentlemen Reserve Privee EDP":  "erkek",
  "Givenchy Gentlemen Society":             "erkek",
  "Initio Oud For Greatness":               "erkek",
  "Kilian Angels Share EDP 50ml":           "erkek",
  "Kilian Angels Share EDP 60ml":           "erkek",
  "Kilian Angels Share French Montana":     "erkek",
  "Kilian Lheure Verte":                    "erkek",
  "Kilian Old Fashioned":                   "erkek",
  "Lattafa Asad":                           "erkek",
  "Lattafa Asad Zanzibar":                  "erkek",
  "Lattafa Khamrah":                        "erkek",
  "Lattafa Khamrah Dukhan":                 "erkek",
  "Lattafa Khamrah Qahwa":                  "erkek",
  "LV Imagination":                         "erkek",
  "LV Limmensite 100ml":                    "erkek",
  "LV Nuit de Feu":                         "erkek",
  "Mancera Red Tobacco":                    "erkek",
  "Marc Antoine Barrois Gamuymede":         "erkek",
  "Nasomatto Black Afgano EDP 30ml":        "erkek",
  "Pantheon Annone":                        "erkek",
  "PDM Althair EDP":                        "erkek",
  "PDM Galloway":                           "erkek",
  "PDM Godolphin Royal Essence 125ml":      "erkek",
  "PDM Greenley 125ml":                     "erkek",
  "PDM Haltane":                            "erkek",
  "PDM Herof Royal Essece 125ml":           "erkek",
  "PDM Kalan Royal Essence 125ml":          "erkek",
  "PDM Layton":                             "erkek",
  "PDM Pegasus":                            "erkek",
  "PDM Pegasus Exclusif":                   "erkek",
  "PDM Percival Royal Essence 125ml":       "erkek",
  "Philipp Plein No Limits":                "erkek",
  "Stephane Humport God Of Fire":           "erkek",
  "Stephane Humport Sand Dance":            "unisex",
  "Tom Ford Black Lacquer":                 "erkek",
  "Tom Ford Grey Vetiver":                  "erkek",
  "Tom Ford Noir EDP 100ml":               "erkek",
  "Tom Ford Noir Extreme EDP 100ml":        "erkek",
  "Tom Ford Oud Wood EDP 100ml":            "erkek",
  "Tom Ford Tuscan Leather Intense":        "erkek",
  "Versace Eau Fraiche Extreme":            "erkek",
  "Xerjoff 1861 Naxos EDP 100ml":          "erkek",
  "Xerjoff Alexandria 2 EDP 100ml":        "erkek",
  "Xerjoff For Tony Iommi":                "erkek",
  "Xerjoff More Than Words":               "erkek",
  "Xerjoff Opera EDP 100ml":              "erkek",
  "YSL Tuxedo Epices Patchouli":           "erkek",
  "Zadig Voltaire This Is Him EDT 100ml":  "erkek",
  "Orto Parisi Risvelium":                 "erkek",
};

async function main() {
  const categories = await prisma.category.findMany({
    where: { slug: { in: ["kadin", "erkek", "unisex", "ozel-koleksiyon"] } },
  });
  const catId = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // MAP'teki tüm ürünleri güncelle (isme göre eşleştir)
  let updated = 0;
  let notFound = [];

  for (const [name, targetSlug] of Object.entries(MAP)) {
    const product = await prisma.product.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, deletedAt: null },
    });
    if (!product) {
      notFound.push(name);
      continue;
    }
    if (product.categoryId === catId[targetSlug]) continue; // zaten doğru
    await prisma.product.update({
      where: { id: product.id },
      data: { categoryId: catId[targetSlug] },
    });
    updated++;
    console.log(`✓ ${name} → ${targetSlug}`);
  }

  // Özel koleksiyon'da hâlâ kalan ürünleri unisex'e taşı
  const remaining = await prisma.product.findMany({
    where: { categoryId: catId["ozel-koleksiyon"], deletedAt: null },
  });
  for (const p of remaining) {
    await prisma.product.update({
      where: { id: p.id },
      data: { categoryId: catId["unisex"] },
    });
    console.log(`⟳ ${p.name} (özel koleksiyon → unisex)`);
    updated++;
  }

  // Özel koleksiyon kategorisini sil (veya devre dışı bırak)
  try {
    await prisma.category.delete({ where: { slug: "ozel-koleksiyon" } });
    console.log("🗑  özel-koleksiyon kategorisi silindi");
  } catch (e) {
    console.log("⚠ kategori silinemedi:", e.message);
  }

  console.log(`\n✅ Toplam güncellenen: ${updated}`);
  if (notFound.length) {
    console.log("❌ Bulunamayanlar:", notFound);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
