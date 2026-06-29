import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// word-boundary replacements: [regex, replacement]
// Ordered from longest to shortest to avoid partial matches
const FIXES: [RegExp, string][] = [
  // Compounds / suffixed forms first (more specific)
  [/\bbilesenleriyle\b/g,  "bileşenleriyle"],
  [/\bbilesenler\b/g,      "bileşenler"],
  [/\bbileseni\b/g,        "bileşeni"],
  [/\byolculugu\b/g,       "yolculuğu"],
  [/\byolculuguna\b/g,     "yolculuğuna"],
  [/\bparfumerinin\b/g,    "parfümerinin"],
  [/\bparfumerisi\b/g,     "parfümerisi"],
  [/\bparfumeri\b/g,       "parfümeri"],
  [/\bparfumdur\b/g,       "parfümdür"],
  [/\bparfumun\b/g,        "parfümün"],
  [/\bparfumu\b/g,         "parfümü"],
  [/\bparfumde\b/g,        "parfümde"],
  [/\bparfum\b/g,          "parfüm"],
  [/\bluksunun\b/g,        "lüksünün"],
  [/\bluksunu\b/g,         "lüksünü"],
  [/\bluks\b/g,            "lüks"],
  [/\bcicegiyle\b/g,       "çiçeğiyle"],
  [/\bcicegin\b/g,         "çiçeğin"],
  [/\bciceksi\b/g,         "çiçeksi"],
  [/\bcicek\b/g,           "çiçek"],
  [/\bcekicilik\b/g,       "çekicilik"],
  [/\bcekici\b/g,          "çekici"],
  [/\bcarpici\b/g,         "çarpıcı"],
  [/\bsecilmis\b/g,        "seçilmiş"],
  [/\bsecilen\b/g,         "seçilen"],
  [/\bsecilmistir\b/g,     "seçilmiştir"],
  [/\bozenle\b/g,          "özenle"],
  [/\borneklerinden\b/g,   "örneklerinden"],
  [/\bornegi\b/g,          "örneği"],
  [/\bornek\b/g,           "örnek"],
  [/\bonde\b/g,            "önde"],
  [/\bOnde\b/g,            "Önde"],
  [/\bOzel\b/g,            "Özel"],
  [/\bozel\b/g,            "özel"],
  [/\bkatmanlidir\b/g,     "katmanlıdır"],
  [/\bkatmanli\b/g,        "katmanlı"],
  [/\bbaslayan\b/g,        "başlayan"],
  [/\bbashlamis\b/g,       "başlamış"],
  [/\btasimayan\b/g,       "taşımayan"],
  [/\btasimaktadir\b/g,    "taşımaktadır"],
  [/\btasiyan\b/g,         "taşıyan"],
  [/\btasir\b/g,           "taşır"],
  [/\btasimak\b/g,         "taşımak"],
  [/\btasinan\b/g,         "taşınan"],
  [/\buzerinde\b/g,        "üzerinde"],
  [/\buzun\b/g,            "uzun"],
  [/\bsureli\b/g,          "süreli"],
  [/\bsureledir\b/g,       "sürelidir"],
  [/\bsure\b/g,            "süre"],
  [/\bsuzulen\b/g,         "süzülen"],
  [/\byansitan\b/g,        "yansıtan"],
  [/\byansitir\b/g,        "yansıtır"],
  [/\bnotalari\b/g,        "notaları"],
  [/\bimzasini\b/g,        "imzasını"],
  [/\bmirasini\b/g,        "mirasını"],
  [/\banlayisini\b/g,      "anlayışını"],
  [/\banlayisi\b/g,        "anlayışı"],
  [/\bgelenegini\b/g,      "geleneğini"],
  [/\bgelenegi\b/g,        "geleneği"],
  [/\bgelenek\b/g,         "gelenek"],
  [/\bdonusturen\b/g,      "dönüştüren"],
  [/\bdonusturulen\b/g,    "dönüştürülen"],
  [/\bbulustiran\b/g,      "buluşturan"],
  [/\bgorkeminin\b/g,      "görkemin"],
  [/\bgorkemli\b/g,        "görkemli"],
  [/\byapiyla\b/g,         "yapıyla"],
  [/\byapisi\b/g,          "yapısı"],
  [/\byaratilan\b/g,       "yaratılan"],
  [/\byaratilmis\b/g,      "yaratılmış"],
  [/\bItalyan\b/g,         "İtalyan"],
  [/\bitalyan\b/g,         "İtalyan"],
  [/\btaniman\b/g,         "tanınan"],
  [/\btanimli\b/g,         "tanımlı"],
  [/\bzanaaatciligini\b/g, "ustalığını"],
  [/\bustaligini\b/g,      "ustalığını"],
  [/\bustaliginden\b/g,    "ustalığından"],
  [/\bustalik\b/g,         "ustalık"],
  [/\bsembohu\b/g,         "simgesi"],
  [/\bDunyanin\b/g,        "Dünyanın"],
  [/\bdunyanin\b/g,        "dünyanın"],
  [/\bkoleksiyonundan\b/g, "koleksiyonundan"],
  [/\balinarak\b/g,        "alınarak"],
  [/\bdonemi\b/g,          "dönemi"],
  [/\bsehir\b/g,           "şehir"],
  [/\bacimayan\b/g,        "açan"],
];

function applyFixes(text: string | null): string | null {
  if (!text) return text;
  let out = text;
  for (const [re, replacement] of FIXES) {
    out = out.replace(re, replacement);
  }
  return out;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, description: true },
  });

  let updated = 0;
  for (const p of products) {
    const fixed = applyFixes(p.description);
    if (fixed !== p.description) {
      await prisma.product.update({
        where: { id: p.id },
        data: { description: fixed },
      });
      updated++;
      if (updated <= 5) {
        console.log(`✓ ${p.name}`);
        console.log(`  Önce: ${p.description?.slice(0, 100)}`);
        console.log(`  Sonra: ${fixed?.slice(0, 100)}`);
      }
    }
  }

  console.log(`\nToplam güncellenen: ${updated} ürün`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
