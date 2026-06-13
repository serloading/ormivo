import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BRAND_INTROS: Record<string, string> = {
  amouage: "Umman'in prestijli parfum evi Amouage'in imzasini tasimayan",
  byredo: "Isvecli minimalist tasarimin basyapiti olarak dogan",
  creed: "Iki bucuk asirlik Ingiliz mirasi Creed'den",
  "tom-ford": "Tom Ford'un carpici ve cesur parfum anlayisini yansitan",
  mfk: "Francis Kurkdjian'in rafine ustaliginden suzulen",
  xerjoff: "Italyan zanaaatciliginin ve luksunun zirvesi Xerjoff'tan",
  kilian: "Kilian Paris'in bascin cikartici ve yogun koleksiyonundan",
  "jo-malone": "Jo Malone London'in zarif ve sade Ingiliz ruhunu tasimayan",
  "parfums-de-marly": "Versailles sarayindan ilham alinarak yaratilan",
  pdm: "Versailles sarayindan ilham alinarak yaratilan",
  initio: "Feromon bilimini yuksek parfumeriyle bulustiran Initio'dan",
  "frederic-malle": "Dunyanin en buyuk parfumorlerinin yaraticiligindan ilham alan",
  "marc-antoine-barrois": "Fransiz moda dunyasindan dogan Marc-Antoine Barrois imzali",
  "matiere-premiere": "Ham maddenin safligini on plana cikaran Matiere Premiere'den",
  nasomatto: "Alessandro Gualtieri'nin deneyci ruhuyla yaratilan Nasomatto koleksiyonundan",
  "orto-parisi": "Orto Parisi'nin doga ve deneyselligiyle harmanlanan yaratici anlayisindan",
  "tiziana-terenzi": "Roma'nin efsanevi parfum evi Tiziana Terenzi'nin el yapimi",
  memo: "Paris ile egzotik diyarlar arasindaki kopruyu kuran Memo'dan",
  mancera: "Paris'in yuksek parfumeri gelenegini dogu kokusuyla harmanlayan Mancera'dan",
  montale: "Dogunun yogun ve mistik ruhunu Fransiz rafineligiyle bulustiran Montale'den",
  "ex-nihilo": "Paris Place Vendome'un kalbinden dogan Ex Nihilo'nun",
  kajal: "Dogu'nun efsanevi koku gelenegini cagdas bir yorumla sunan Kajal'dan",
  kayali: "Dogu'nun basatan cikartici koku mirasini modern dunyaya aktaran Kayali'nin",
  casamorati: "1888'den bu yana Italya'nin parfumeri gelenegini yasatan Casamorati'nin",
  "clive-christian": "Dunyanin en degerli parfum evi unvanini tasimayan Clive Christian'dan",
  "carner-barcelona": "Barcelona'nin canli enerjisini ve Akdeniz ruhunu tasimayan Carner'dan",
  "maison-crivelli": "Cicek yetistirme sanatindan ilham alinarak yaratilan Maison Crivelli'nin",
  zoologist: "Hayvanlar dunyasindan ilham alinarak yaratilan sanatsal nis marka Zoologist'ten",
  "armani-prive": "Giorgio Armani'nin ozel koleksiyonu Armani Prive'den",
  "bvlgari-le-gemme": "Bvlgari'nin en seckin ve nadir taslardan ilham alan Le Gemme serisinden",
  pantheon: "Roma'nin antik mirasindan ilham alan Pantheon'dan",
  lattafa: "Korfez koku gelenegini premium kaliteyle bulustiran Lattafa'dan",
  anfar: "Geleneksel Arap parfumeri sanatini modern yorumla sunan Anfar'dan",
  dior: "Moda dunyasinin efsanesi Dior'un ikonik parfum koleksiyonundan",
  "christian-dior": "Moda dunyasinin efsanesi Dior'un ikonik parfum koleksiyonundan",
  guerlain: "1828'den bu yana Fransiz parfumerisinin mirasini tasimayan Guerlain'den",
  lancome: "Fransiz moda ve guzellik dunyasinin simgesi Lancome'dan",
  givenchy: "Parisiyen zarafeti ve modernligi harmanlayan Givenchy'den",
  ysl: "Yves Saint Laurent'in carpici ve guclu imzasini tasimayan",
  gucci: "Italyan luksunun simgesi Gucci'nin cekici koleksiyonundan",
  prada: "Minimalist Italyan zevkini yansitan Prada'dan",
  versace: "Italyan tutkunun ve gorkeminin sembohu Versace'den",
  "hugo-boss": "Alman modernligini kokuya donusturen Hugo Boss'tan",
  "paco-rabanne": "Avangard tasarimiyla taniman Paco Rabanne'in",
  burberry: "Ingiliz zarafetini ve ikonik ekose mirasini tasimayan Burberry'den",
  "carolina-herrera": "New York'un enerjisini ve zarafetini kokuya donusturen Carolina Herrera'dan",
  valentino: "Roma'nin siirsel guzelligi ve Italyan zarafetini yansitan Valentino'dan",
  cartier: "Mucevherat dunyasinin prestijli ismi Cartier'in",
  "dolce-gabbana": "Italya'nin tutkusunu ve sicakligini kokuya aktaran Dolce and Gabbana'dan",
  "viktor-rolf": "Sanatsal parfum anlayisiyla onsuz olunmayan Viktor and Rolf'tan",
  montblanc: "Isvicre mukemmeliyetciligini ve sofistike sikligi bulustiran Montblanc'tan",
  "michael-kors": "New York'un glamurunu ve kozmopolit ruhunu yansitan Michael Kors'tan",
  kenzo: "Japon kulturunun doga sevgisini Fransiz modasiyla harmanlayan Kenzo'dan",
  lacoste: "Sportif zarafeti ve ozgurluk ruhunu kokuya tasimayan Lacoste'tan",
  azzaro: "Fransiz zarafetini ve coskullu karakteri harmanlayan Azzaro'dan",
  bvlgari: "Antik Roma'nin enerjisi ve Italyan zanaaatciligini tasimayan Bvlgari'den",
  mugler: "Futuristik vizyonu kokuya donusturen Mugler'in",
  chloe: "Chloe'nin ozgur ruhlu ve doga ilhamli feminen dunyasindan",
  "estee-lauder": "Guzellik endustrisinin devrimci ismi Estee Lauder'den",
  "narciso-rodriguez": "Saf ve cagdas minimal estetigi yansitan Narciso Rodriguez'in",
  gisada: "Isvicre saat ustaliginin hassasiyetini parfumeriye tasimayan Gisada'dan",
  dunhill: "Ingiliz erkek zevkinin asil gelenegini surduren Alfred Dunhill'den",
  "roberto-cavalli": "Italyan vahsi guzelligi ve luksu harmanlayan Roberto Cavalli'den",
  "calvin-klein": "Amerikan minimalizmi ve saf tazeligi harmanlayan Calvin Klein'dan",
  default: "Dunyanin onde gelen parfum evlerinden ozenle secilen",
};

const CAT_PHRASES: Record<string, string[]> = {
  kadin: [
    "guclu ve feminen bir iz birakan bu koku, her kadinin vazgecilmezi olmaya aday.",
    "zarif ve carpici yapiyla kadin kimliginin en guzel ifadelerinden biri.",
    "basatan cikartici ve sofistike karakteriyle modern kadinin tercihine sunuluyor.",
    "akilda kalici kokusuyla her ortamda iz birakan, kalici ve feminen bir kreasyondur.",
  ],
  erkek: [
    "karizmatik ve guclu yapiyla kendine guvenin erkeklerin favorisi olacak bir kreasyondur.",
    "modern maskulenligi klasik zarafetle harmanlayan, dikkat cekici bir koku.",
    "guclu iz birakan karakteriyle her ortama uygun, prestijli bir parfum deneyimi.",
    "cesur ve akilda kalici yapiyla iddia sahibi erkeklerin tercihi.",
  ],
  unisex: [
    "cinsiyet sinirlarini asan evrensel karakteriyle herkese hitap eden bir kreasyondur.",
    "modern parfumerinin ozgurlukcu ruhunu yansitan, herkesin kucaklayabilecegi bir koku.",
    "kadin ve erkegi bulustiran dengeli yapiyla sinir tanimayan bir parfum deneyimi.",
    "kisisel ifadenin on planda oldugu, ozgun ve etkileyici bir kreasyondur.",
  ],
  "ozel-koleksiyon": [
    "nis parfumerinin sinir tanimayan yaraticiligindan dogan, koleksiyoncularin gozdesi olan bir kreasyondur.",
    "alisildik sinirlarin cok otesinde, ham ve ozgun bir koku deneyimi sunan sanatsal bir parfumdur.",
    "olagandisi bilesenleri ve ozgun formuluyle parfum dunyasinda kendine ayri bir yer edinen bir basyapittir.",
    "koku sanatinin sinirlarini zorlayan, nadirligiyle deger kazanan bir koleksiyon parcasidir.",
  ],
  default: [
    "ozenle secilmis bilesenleriyle luks parfumerinin en iyi orneklerinden biri.",
    "kalici ve etkileyici yapiyla her ortamda kendini belli eden zarif bir kreasyondur.",
    "yuksek konsantrasyonu ve kaliteli hammaddeleriyle uzun sure kokan, prestijli bir parfumdur.",
    "deri uzerinde cicek acimayan katmanli yapiyla unutulmaz bir koku deneyimi sunar.",
  ],
};

function getNotaHint(slug: string): string {
  if (slug.includes("oud") || slug.includes("bakhoor")) return "Derin oud notalari";
  if (slug.includes("rose") || slug.includes("rosa")) return "Ince gul notalari";
  if (slug.includes("amber") || slug.includes("ambre")) return "Sicak amber notalari";
  if (slug.includes("vanilla") || slug.includes("vanille")) return "Kadifemsi vanilya notalari";
  if (slug.includes("aqua") || slug.includes("blue") || slug.includes("ocean")) return "Ferah aquatik notalar";
  if (slug.includes("wood") || slug.includes("cedar") || slug.includes("sandal")) return "Odunsu notalar";
  if (slug.includes("musk") || slug.includes("musks")) return "Saf misk notalari";
  if (slug.includes("jasmin") || slug.includes("jasmine")) return "Ciceksi yasemin notalari";
  if (slug.includes("black") || slug.includes("noir") || slug.includes("dark")) return "Gizemli karanlik notalar";
  if (slug.includes("gold") || slug.includes("royal")) return "Altin ve baharat notalari";
  if (slug.includes("fresh") || slug.includes("citrus")) return "Ferah narenciye notalari";
  if (slug.includes("tobacco") || slug.includes("tabac")) return "Duman ve tutun notalari";
  if (slug.includes("iris") || slug.includes("orris")) return "Kadifemsi iris notalari";
  return "Sofistike ve katmanli notalar";
}

function pick(arr: string[], seed: number): string {
  return arr[Math.abs(seed) % arr.length];
}

function generateDescription(slug: string, brandSlug: string | null, catSlug: string | null): string {
  const brandKey = Object.keys(BRAND_INTROS).find((k) => slug.startsWith(k + "-") || slug === k || (brandSlug && (brandSlug.startsWith(k) || k === brandSlug)));
  const intro = brandKey ? BRAND_INTROS[brandKey] : BRAND_INTROS.default;
  const nota = getNotaHint(slug);
  const phrases = CAT_PHRASES[catSlug ?? "default"] ?? CAT_PHRASES.default;
  const phrase = pick(phrases, (slug.charCodeAt(0) ?? 0) + (slug.charCodeAt(slug.length - 1) ?? 0));
  return `${intro} bu ozel kreasyonda ${nota.toLowerCase()} ile baslayan derin ve katmanli bir koku yolculugu sizi bekliyor. ${phrase.charAt(0).toUpperCase() + phrase.slice(1)}`;
}

async function main() {
  console.log("Aciklama seed basliyor...");
  const products = await prisma.product.findMany({
    where: { deletedAt: null, description: null },
    include: { brand: true, category: true },
  });
  console.log(products.length + " aciklamasiz urun bulundu");
  let updated = 0;
  for (const p of products) {
    const desc = generateDescription(p.slug, p.brand?.slug ?? null, p.category?.slug ?? null);
    await prisma.product.update({ where: { id: p.id }, data: { description: desc } });
    updated++;
    if (updated % 50 === 0) console.log(updated + " / " + products.length);
  }
  console.log(updated + " urune aciklama eklendi");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
