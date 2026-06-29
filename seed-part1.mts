import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

const CAT_KADIN = '157a83bd-ac0e-4209-afbe-4a6b521c0d1c';
const CAT_ERKEK = '1396bc28-5544-4b6e-b002-b7dbd2dc4569';
const CAT_UNISEX = '43814ff0-f64a-48cc-be2e-07fde204bce6';

function slug(s: string) {
  return s.toLowerCase()
    .replace(/[çÇ]/g, 'c').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[ıİ]/g, 'i')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function upsertBrand(name: string, bslug: string) {
  const existing = await prisma.brand.findFirst({ where: { slug: bslug } });
  if (existing) return existing;
  return prisma.brand.create({ data: { name, slug: bslug } });
}

async function addProduct(p: {
  name: string; brandId: string; categoryId: string;
  price: number; description: string; scentNotes: string;
  isOzelKoleksiyon?: boolean;
}) {
  const existing = await prisma.product.findFirst({ where: { name: p.name, brandId: p.brandId } });
  if (existing) return null;
  const s = slug(p.name) + '-' + Date.now() + Math.floor(Math.random() * 1000);
  return prisma.product.create({
    data: {
      name: p.name, slug: s, description: p.description, scentNotes: p.scentNotes,
      price: p.price, stock: 0, isActive: true, images: [],
      brandId: p.brandId, categoryId: p.categoryId,
      isOzelKoleksiyon: p.isOzelKoleksiyon ?? false,
    }
  });
}

const added: string[] = [];

async function main() {
  // ── ROJA PARFUMS ──────────────────────────────────────────────────────────
  const roja = await upsertBrand('Roja Parfums', 'roja-parfums');
  const rojaProducts = [
    { name: 'Roja Parfums Aoud', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Pembe biber\nOrta: Oud, Gül, Sandal\nAlt: Misk, Amber, Vanilya', desc: 'Büyüleyici oud yorumuyla Doğu\'nun zenginliğini yansıtan ikonik bir koku.' },
    { name: 'Roja Parfums Danger', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Limon\nOrta: Lavanta, Gül, Sedir\nAlt: Meşe yosunu, Misk, Amber', desc: 'Güçlü ve çekici, maskülen bir Roja imzası.' },
    { name: 'Roja Parfums Apex', cat: CAT_UNISEX, notes: 'Üst: Portakal, Bergamot\nOrta: Iris, Zambak, Sandal\nAlt: Misk, Vetiver, Sığla', desc: 'Sofistike ve zarif, zirveye ulaşmak için tasarlanmış bir parfüm.' },
    { name: 'Roja Parfums Danger Essence', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Limon\nOrta: Lavanta, Gül\nAlt: Amber, Misk, Benzoin', desc: 'Danger\'ın daha yoğun ve esansiyel versiyonu.' },
    { name: 'Roja Parfums Burlington 1819', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Pembe biber\nOrta: Iris, Sandal, Gül\nAlt: Amber, Misk, Sığla', desc: 'Burlington Arcade\'e adanmış, İngiliz zarafetinin özü.' },
    { name: 'Roja Parfums Diaghilev', cat: CAT_UNISEX, notes: 'Üst: Aldehitler, Bergamot\nOrta: Gül, Iris, Ylang\nAlt: Sandal, Sığla, Amber, Misk', desc: 'Rus bale maestrosuna adanmış, sanat ve lüksün birleşimi.' },
    { name: 'Roja Parfums Elixir', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Portakal\nOrta: Gül, Iris\nAlt: Amber, Oud, Misk', desc: 'Duyuları büyüleyen, zengin ve lüks bir elixir.' },
    { name: 'Roja Parfums Musk Aoud', cat: CAT_UNISEX, notes: 'Üst: Pembe biber\nOrta: Oud, Sandal\nAlt: Misk, Amber, Vanilya', desc: 'Misk ve oud\'un kusursuz birlikteliği.' },
    { name: 'Roja Parfums Enigma', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Iris, Gül, Lavanta\nAlt: Amber, Sandal, Misk', desc: 'Gizemli ve çekici, her giyende farklı bir anlam kazanan koku.' },
    { name: 'Roja Parfums Oligarch', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Limon, Adaçayı\nOrta: Gül, Lavanta, Amber\nAlt: Sığla, Misk, Sandal', desc: 'Güç ve varlığı temsil eden, maskülen bir imza kokusu.' },
    { name: 'Roja Parfums Isola Blu', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Deniz notaları\nOrta: Sümbül, Iris\nAlt: Sedir, Misk, Amber', desc: 'Mavi bir adanın özgürlük ve serinliğini yansıtan koku.' },
    { name: 'Roja Parfums Scandal', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Limon\nOrta: Lavanta, Gül\nAlt: Amber, Misk, Sandal', desc: 'Skandalın cazibesini taşıyan cesur ve özgün bir erkek parfümü.' },
    { name: 'Roja Parfums Reckless', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris, Zambak\nAlt: Misk, Sandal, Amber', desc: 'Pervasız ve özgür ruhlu kadınlar için tasarlanmış.' },
    { name: 'Roja Parfums Risque', cat: CAT_KADIN, notes: 'Üst: Bergamot, Pembe biber\nOrta: Gül, Iris\nAlt: Misk, Vanilya, Amber', desc: 'Riski seven, cesur kadınlara özel bir koku.' },
    { name: 'Roja Parfums 51', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Sandal, Iris\nAlt: Amber, Misk, Sığla', desc: '51 numaralı formülün mükemmeliyetine adanmış bir parfüm.' },
  ];
  for (const p of rojaProducts) {
    const r = await addProduct({ name: p.name, brandId: roja.id, categoryId: p.cat, price: 5500, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── PENHALIGON'S ──────────────────────────────────────────────────────────
  const pen = await upsertBrand("Penhaligon's", 'penhaligons');
  const penProducts = [
    { name: "Penhaligon's Beauregard", cat: CAT_ERKEK, notes: 'Üst: Bergamot, Greyfurt\nOrta: Lavanta, Gül\nAlt: Sandal, Amber, Vetiver', desc: 'İngiliz zarafetinin özünü yansıtan klasik bir erkek kokusu.' },
    { name: "Penhaligon's Lord George", cat: CAT_ERKEK, notes: 'Üst: Bergamot, Limon\nOrta: Lavanta, Iris\nAlt: Sandal, Misk, Sedir', desc: 'Lord George karakterinden ilham alan, aristokrat bir koku.' },
    { name: "Penhaligon's Clara", cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Zambak, Iris\nAlt: Misk, Sandal, Amber', desc: 'Clara karakterinin zarafetini taşıyan çiçeksi bir koku.' },
    { name: "Penhaligon's Sohan", cat: CAT_UNISEX, notes: 'Üst: Safran, Bergamot\nOrta: Oud, Gül, Sandal\nAlt: Amber, Misk, Vetiver', desc: 'Doğu\'nun zenginliğini Batı zarif estetiğiyle buluşturan koku.' },
    { name: "Penhaligon's Lady Blanche", cat: CAT_KADIN, notes: 'Üst: Bergamot, Greyfurt\nOrta: Gül, Sümbül, Iris\nAlt: Misk, Sandal, Vanilya', desc: 'Lady Blanche\'ın narin ve zarif kişiliğini yansıtan çiçeksi koku.' },
    { name: "Penhaligon's The Duke", cat: CAT_ERKEK, notes: 'Üst: Bergamot, Karabiber\nOrta: Lavanta, Sandal\nAlt: Meşe yosunu, Misk, Amber', desc: 'Bir dükün otoritesini ve zarafetini taşıyan güçlü bir parfüm.' },
    { name: "Penhaligon's Yasmine", cat: CAT_KADIN, notes: 'Üst: Bergamot, Yeşil notalar\nOrta: Yasemin, Gül\nAlt: Misk, Sandal, Amber', desc: 'Yasemin çiçeğinin saf güzelliğini yakalayan klasik bir koku.' },
    { name: "Penhaligon's Halfeti Cedar", cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Gül, Sedir\nAlt: Oud, Amber, Misk', desc: 'Halfeti gülünün ender güzelliğini sedir ağacıyla harmanlayan bir koku.' },
  ];
  for (const p of penProducts) {
    const r = await addProduct({ name: p.name, brandId: pen.id, categoryId: p.cat, price: 4800, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── SOSPIRO ───────────────────────────────────────────────────────────────
  const sospiro = await upsertBrand('Sospiro', 'sospiro');
  const sospiroProducts = [
    { name: 'Sospiro Erba Pura', cat: CAT_UNISEX, notes: 'Üst: Greyfurt, Bergamot, Mandarin\nOrta: Sicilya portakalı, Kaktüs çiçeği\nAlt: Misk, Amber, Sandal', desc: 'İtalyan Rivierası\'nın taze ve güneşli havasını taşıyan ikonik bir koku.' },
    { name: 'Sospiro Erba Gold', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Greyfurt\nOrta: Ylang, Gül, Sandal\nAlt: Amber, Misk, Vanilya', desc: 'Erba Pura\'nın altın versiyonu, daha sıcak ve yoğun.' },
    { name: 'Sospiro Accento', cat: CAT_UNISEX, notes: 'Üst: Ananas, Mango, Passion fruit\nOrta: Sümbül, Gül\nAlt: Amber, Sandal, Misk', desc: 'Tropik meyvelerin canlılığını taşıyan İtalyan zarafeti.' },
    { name: 'Sospiro Opera', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Iris, Sandal\nAlt: Oud, Amber, Misk', desc: 'Bir opera performansının tutkusunu ve dramatizmini yansıtan koku.' },
    { name: 'Sospiro Wardasina', cat: CAT_UNISEX, notes: 'Üst: Safran, Bergamot\nOrta: Gül, Oud\nAlt: Amber, Misk, Sandal', desc: 'Gülün ve oudun romantik dansını konu alan Orta Doğu ilhamlı koku.' },
    { name: 'Sospiro Diapason', cat: CAT_UNISEX, notes: 'Üst: Limon, Bergamot\nOrta: Tuberoz, Zambak\nAlt: Misk, Sandal, Vanilya', desc: 'Müzikal bir armoninin güzelliğini taşıyan zarif bir koku.' },
    { name: 'Sospiro Magica', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris, Yasemin\nAlt: Misk, Sandal, Amber', desc: 'Büyülü ve karizmatik, kadınlığın en güzel halini yansıtan koku.' },
    { name: 'Sospiro Erba Leather', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Deri, Gül\nAlt: Amber, Oud, Misk', desc: 'Erba Pura\'nın deri yorumu, daha güçlü ve cesur.' },
    { name: 'Sospiro Erba Pura Box', cat: CAT_UNISEX, notes: 'Üst: Greyfurt, Bergamot, Mandarin\nOrta: Sicilya portakalı, Kaktüs çiçeği\nAlt: Misk, Amber, Sandal', desc: 'Erba Pura\'nın özel kutu versiyonu.' },
    { name: 'Sospiro Rosso Afgano', cat: CAT_UNISEX, notes: 'Üst: Safran, Bergamot\nOrta: Gül, Oud, Sandal\nAlt: Amber, Misk, Deri', desc: 'Afgan gülleri ve oudun zengin karışımı.' },
    { name: 'Sospiro Ensemble', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Farklı notaların kusursuz armonisini sunan sofistike koku.' },
    { name: 'Sospiro Erba Pura Magica', cat: CAT_UNISEX, notes: 'Üst: Greyfurt, Bergamot\nOrta: Kaktüs çiçeği, Tuberoz\nAlt: Misk, Amber, Vanilya', desc: 'Erba Pura ve Magica\'nın büyülü birleşimi.' },
  ];
  for (const p of sospiroProducts) {
    const r = await addProduct({ name: p.name, brandId: sospiro.id, categoryId: p.cat, price: 4200, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── SHAIK ─────────────────────────────────────────────────────────────────
  const shaik = await upsertBrand('Shaik', 'shaik');
  const shaikProducts = [
    { name: 'Shaik Gold No 1', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Shaik\'in altın koleksiyonunun ilk ve en ikonik parfümü.' },
    { name: 'Shaik No 33', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Limon\nOrta: Lavanta, Fern\nAlt: Amber, Sandal, Sedir', desc: 'Klasik fougère yapısıyla modern bir maskülen koku.' },
    { name: 'Shaik No 70', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Pembe biber\nOrta: Gül, Iris, Sandal\nAlt: Amber, Misk, Vetiver', desc: 'Şık ve çekici, özel anlar için tasarlanmış erkek parfümü.' },
    { name: 'Shaik No 77', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris, Yasemin\nAlt: Misk, Sandal, Vanilya', desc: 'Çiçeksi ve feminen, zarif kadınlar için özel bir koku.' },
  ];
  for (const p of shaikProducts) {
    const r = await addProduct({ name: p.name, brandId: shaik.id, categoryId: p.cat, price: 4000, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── THOMAS KOSMALA ────────────────────────────────────────────────────────
  const tk = await upsertBrand('Thomas Kosmala', 'thomas-kosmala');
  const tkProducts = [
    { name: 'Thomas Kosmala Arabian Passion', cat: CAT_UNISEX, notes: 'Üst: Safran, Bergamot\nOrta: Gül, Oud, Sandal\nAlt: Amber, Misk, Deri', desc: 'Arap parfümeri geleneğinden ilham alan tutkulu bir koku.' },
    { name: 'Thomas Kosmala No 4', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Greyfurt\nOrta: Iris, Sandal\nAlt: Misk, Amber, Vetiver', desc: 'Saf misk ve sürpriz notalarıyla zarif bir unisex parfüm.' },
    { name: 'Thomas Kosmala No 4 Sport', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Sandal, Iris\nAlt: Misk, Amber', desc: 'No 4\'ün spor ruhuyla harmanlanmış versiyonu.' },
    { name: 'Thomas Kosmala No 4 Neon', cat: CAT_UNISEX, notes: 'Üst: Neon notalar, Bergamot\nOrta: Iris, Sandal\nAlt: Misk, Amber', desc: 'No 4\'ün neon ışıklar kadar parlak ve enerjik versiyonu.' },
    { name: 'Thomas Kosmala Ending Lover', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Pembe biber\nOrta: Gül, Iris\nAlt: Amber, Misk, Sandal', desc: 'Ayrılığın melankolisini ve romantizmini anlatan bir koku.' },
    { name: 'Thomas Kosmala No 10', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberoz, Gül\nAlt: Misk, Sandal, Vanilya', desc: 'Koleksiyonun en özel numara 10\'u, eksiksiz zarafet.' },
    { name: 'Thomas Kosmala No 5', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Iris, Sandal\nAlt: Amber, Misk', desc: 'Minimalist ve sofistike, sayının mükemmelliğini taşıyan koku.' },
    { name: 'Thomas Kosmala No 6', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Lavanta, Iris\nAlt: Sandal, Misk, Amber', desc: 'Altı notanın kusursuz dengesi.' },
    { name: 'Thomas Kosmala No 7', cat: CAT_UNISEX, notes: 'Üst: Greyfurt, Bergamot\nOrta: Gül, Iris\nAlt: Amber, Sandal, Misk', desc: 'Yedi mükemmelliğini arayan parfüm tutkunları için.' },
    { name: 'Thomas Kosmala No 8', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Sandal, Tuberoz\nAlt: Misk, Amber, Vanilya', desc: 'Sekizin bereketini taşıyan zengin ve besleyici bir koku.' },
    { name: 'Thomas Kosmala No 9', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Oud, Gül\nAlt: Amber, Misk, Sandal', desc: 'Dokuzun gizemi ve derinliğiyle dolu Doğu ilhamlı koku.' },
  ];
  for (const p of tkProducts) {
    const r = await addProduct({ name: p.name, brandId: tk.id, categoryId: p.cat, price: 4500, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── BOADICEA THE VICTORIOUS ───────────────────────────────────────────────
  const boadicea = await upsertBrand('Boadicea The Victorious', 'boadicea-the-victorious');
  const boadiceaProducts = [
    { name: 'Boadicea The Victorious Aurica', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris, Yasemin\nAlt: Amber, Misk, Sandal', desc: 'Altın bir auranın zarafetini yansıtan ihtişamlı bir koku.' },
    { name: 'Boadicea The Victorious Hanuman', cat: CAT_UNISEX, notes: 'Üst: Karabiber, Bergamot\nOrta: Sandal, Oud\nAlt: Amber, Deri, Misk', desc: 'Hanuman\'ın gücünü ve özgürlüğünü anlatan mistik bir parfüm.' },
    { name: 'Boadicea The Victorious Tiger', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Oud, Sandal\nAlt: Amber, Deri, Misk', desc: 'Kaplanın gücünü ve zarafetini taşıyan cesur bir koku.' },
    { name: 'Boadicea The Victorious Blue Sapphire', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Iris, Lavanta, Sandal\nAlt: Misk, Amber, Sedir', desc: 'Mavi safirin berraklığını ve derinliğini yansıtan koku.' },
    { name: 'Boadicea The Victorious Valiant', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Greyfurt\nOrta: Lavanta, Gül\nAlt: Amber, Sandal, Misk', desc: 'Cesaret ve onurun parfümü, savaşçı ruhuna adanmış.' },
  ];
  for (const p of boadiceaProducts) {
    const r = await addProduct({ name: p.name, brandId: boadicea.id, categoryId: p.cat, price: 5000, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── BOTTEGA VENETA ────────────────────────────────────────────────────────
  const bv = await upsertBrand('Bottega Veneta', 'bottega-veneta');
  const bvProducts = [
    { name: 'Bottega Veneta Lauro', cat: CAT_UNISEX, notes: 'Üst: Defne yaprağı, Bergamot\nOrta: Vetiver, Gül\nAlt: Amber, Deri, Misk', desc: 'İtalyan ustalığının özünü taşıyan zengin ve sofistike bir koku.' },
    { name: 'Bottega Veneta Violetta', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Menekşe, Gül\nAlt: Sandal, Misk, Vanilya', desc: 'Menekşenin narin güzelliğini yansıtan zarif bir kadın parfümü.' },
    { name: 'Bottega Veneta Lilla', cat: CAT_KADIN, notes: 'Üst: Leylak, Bergamot\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Leylak çiçeğinin büyülü kokusundan ilham alan zarif parfüm.' },
    { name: 'Bottega Veneta Salvia Blu', cat: CAT_UNISEX, notes: 'Üst: Adaçayı, Bergamot\nOrta: Gül, Iris\nAlt: Amber, Sandal, Vetiver', desc: 'Mavi adaçayının taze ve otsu tonlarını yansıtan unisex koku.' },
    { name: 'Bottega Veneta Rosa', cat: CAT_KADIN, notes: 'Üst: Bergamot, Greyfurt\nOrta: Gül, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Saf güllerin romantizmini taşıyan feminen bir koku.' },
    { name: 'Bottega Veneta Parco Palladino', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Sedir\nAlt: Amber, Misk, Sandal', desc: 'Palladio parkının zarafetini ve İtalyan mirasını anlatan koku.' },
    { name: 'Bottega Veneta Eau De Parfum', cat: CAT_KADIN, notes: 'Üst: Bergamot, Deri\nOrta: Iris, Gül\nAlt: Sandal, Deri, Amber', desc: 'Klasik Bottega Veneta imzasını taşıyan kadın parfümü.' },
    { name: 'Bottega Veneta Pour Homme', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Greyfurt\nOrta: Sedir, Iris\nAlt: Vetiver, Misk, Amber', desc: 'İtalyan elegansını taşıyan modern bir erkek parfümü.' },
    { name: 'Bottega Veneta Illusione', cat: CAT_KADIN, notes: 'Üst: Bergamot, Limon\nOrta: Iris, Gül, Sandal\nAlt: Amber, Misk, Vanilya', desc: 'Bir illüzyonun büyüsünü yaşatan feminen koku.' },
    { name: 'Bottega Veneta L\'Absolu', cat: CAT_KADIN, notes: 'Üst: Bergamot, Deri\nOrta: Iris, Gül\nAlt: Sandal, Deri, Vanilya', desc: 'Bottega Veneta\'nın en yoğun ve mutlak ifadesi.' },
    { name: 'Bottega Veneta Eau Sensuelle', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Duyuları uyandıran, hassas ve feminen bir koku.' },
  ];
  for (const p of bvProducts) {
    const r = await addProduct({ name: p.name, brandId: bv.id, categoryId: p.cat, price: 3500, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: false });
    if (r) added.push(p.name);
  }

  // ── BOUCHERON ─────────────────────────────────────────────────────────────
  const boucheron = await upsertBrand('Boucheron', 'boucheron');
  const boucheronProducts = [
    { name: 'Boucheron Vanille', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberoz, Gül\nAlt: Vanilya, Amber, Misk', desc: 'Vanilyayla sarmalanmış lüks bir mücevher gibi koku.' },
    { name: 'Boucheron Oud', cat: CAT_UNISEX, notes: 'Üst: Safran, Bergamot\nOrta: Oud, Gül, Sandal\nAlt: Amber, Misk, Deri', desc: 'Mücevher ustası Boucheron\'un oud yorumuyla Doğu\'nun zenginliği.' },
  ];
  for (const p of boucheronProducts) {
    const r = await addProduct({ name: p.name, brandId: boucheron.id, categoryId: p.cat, price: 3800, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── CLUB DE NUIT (ARMAF) ──────────────────────────────────────────────────
  const cdn = await upsertBrand('Club de Nuit', 'club-de-nuit');
  const cdnProducts = [
    { name: 'Club de Nuit Intense Man', cat: CAT_ERKEK, notes: 'Üst: Ananas, Bergamot, Siyah kuş üzümü\nOrta: Gül, Yasemin, Sandal\nAlt: Amber, Misk, Vetiver', desc: 'Creed Aventus ilhamlı, büyüleyici bir erkek kokusu.' },
    { name: 'Club de Nuit Intense Woman', cat: CAT_KADIN, notes: 'Üst: Ananas, Bergamot\nOrta: Gül, Yasemin, Iris\nAlt: Sandal, Misk, Amber', desc: 'Feminen ve büyüleyici, gece kulübünün cazibesi.' },
    { name: 'Club de Nuit Milestone', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Iris\nAlt: Amber, Sandal, Misk', desc: 'Hayatın önemli dönüm noktalarına adanmış prestijli bir koku.' },
    { name: 'Club de Nuit Sillage', cat: CAT_UNISEX, notes: 'Üst: Ananas, Bergamot\nOrta: Gül, Iris\nAlt: Amber, Sandal, Misk', desc: 'Unutulmaz bir iz bırakan, güçlü sillaj özellikli koku.' },
    { name: 'Club de Nuit Man EDT', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Günlük kullanım için ferah ve çekici erkek kokusu.' },
    { name: 'Club de Nuit Woman', cat: CAT_KADIN, notes: 'Üst: Bergamot, Ananas\nOrta: Gül, Yasemin\nAlt: Misk, Amber, Sandal', desc: 'Kadınsı ve zarif, gece için mükemmel koku.' },
    { name: 'Club de Nuit Iconic', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Gül, Iris, Sandal\nAlt: Amber, Misk, Vetiver', desc: 'İkonik olmak için tasarlanmış kalıcı ve etkileyici koku.' },
    { name: 'Club de Nuit Imperiale', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Oud, Sandal\nAlt: Amber, Misk, Deri', desc: 'İmparatorluk ihtişamını taşıyan lüks bir koku.' },
  ];
  for (const p of cdnProducts) {
    const r = await addProduct({ name: p.name, brandId: cdn.id, categoryId: p.cat, price: 3200, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: false });
    if (r) added.push(p.name);
  }

  // ── HFC (HAUTE FRAGRANCE COMPANY) ─────────────────────────────────────────
  const hfc = await upsertBrand('HFC Paris', 'hfc-paris');
  const hfcProducts = [
    { name: 'HFC Dancing Queen', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Tuberoz, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Dansın zarafetini ve neşesini taşıyan feminen koku.' },
    { name: 'HFC Or Noir', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Oud\nAlt: Amber, Deri, Misk', desc: 'Kara altının değerini ve derinliğini taşıyan lüks koku.' },
    { name: 'HFC Devils Intrigue', cat: CAT_UNISEX, notes: 'Üst: Karabiber, Bergamot\nOrta: Deri, Gül\nAlt: Amber, Oud, Misk', desc: 'Şeytanın cazibesini ve entrikasını anlatan cesur parfüm.' },
    { name: 'HFC Divine Blossom', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Yasemin, Tuberoz\nAlt: Sandal, Misk, Vanilya', desc: 'İlahi çiçeklerin zarafetini yansıtan narin kadın kokusu.' },
  ];
  for (const p of hfcProducts) {
    const r = await addProduct({ name: p.name, brandId: hfc.id, categoryId: p.cat, price: 3800, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── ATKINSONS ─────────────────────────────────────────────────────────────
  const atk = await upsertBrand('Atkinsons', 'atkinsons');
  const atkProducts = [
    { name: 'Atkinsons My Fair Lily', cat: CAT_KADIN, notes: 'Üst: Greyfurt, Bergamot\nOrta: Zambak, Sümbül, Gül\nAlt: Misk, Sandal, Amber', desc: 'İngiliz çiçek bahçesinin zarif zambak kokusunu taşıyan parfüm.' },
    { name: 'Atkinsons Fashion Decree', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Moda dünyasının kararını taşıyan sofistike İngiliz kokusu.' },
    { name: 'Atkinsons Oud Save The Queen', cat: CAT_KADIN, notes: 'Üst: Safran, Bergamot\nOrta: Gül, Oud\nAlt: Amber, Misk, Sandal', desc: 'Kraliçe\'ye saygı duruşunun oud ile ifadesi.' },
    { name: 'Atkinsons Oud Save The King', cat: CAT_ERKEK, notes: 'Üst: Safran, Karabiber\nOrta: Oud, Gül\nAlt: Amber, Deri, Misk', desc: 'Kral\'a adanmış, oud ağırlıklı güçlü ve asil bir parfüm.' },
  ];
  for (const p of atkProducts) {
    const r = await addProduct({ name: p.name, brandId: atk.id, categoryId: p.cat, price: 4200, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── BDK PARFUMS PARIS ─────────────────────────────────────────────────────
  const bdk = await upsertBrand('BDK Parfums', 'bdk-parfums');
  const bdkProducts = [
    { name: 'BDK Gris Charnel', cat: CAT_UNISEX, notes: 'Üst: Greyfurt, Bergamot\nOrta: Sandal, Iris\nAlt: Gri amber, Misk, Sığla', desc: 'Gri tenlerin cazibesini yansıtan, ince ve zarif bir Paris parfümü.' },
    { name: 'BDK Rouge Smoking', cat: CAT_UNISEX, notes: 'Üst: Pembe biber, Bergamot\nOrta: Gül, İris\nAlt: Deri, Amber, Tütün', desc: 'Kırmızı smoking giymiş bir Parisli kadının özgürlük ve cesaret kokusu.' },
    { name: 'BDK Pas Ce Soir', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Yasemin\nAlt: Misk, Sandal, Amber', desc: '"Bu gece değil" diyen kadının cazibesini yansıtan koku.' },
  ];
  for (const p of bdkProducts) {
    const r = await addProduct({ name: p.name, brandId: bdk.id, categoryId: p.cat, price: 4800, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── FRANK BOCLET ──────────────────────────────────────────────────────────
  const fb = await upsertBrand('Frank Boclet', 'frank-boclet');
  const fbProducts = [
    { name: 'Frank Boclet Cocaine', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Litsea\nOrta: Zambak, Sandal\nAlt: Misk, Amber, Sığla', desc: 'Cesur ve provokatif, bağımlılık yapan bir koku deneyimi.' },
    { name: 'Frank Boclet Velvet', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris, Sandal\nAlt: Amber, Misk, Vanilya', desc: 'Kadifenin dokunuşu kadar yumuşak ve lüks bir koku.' },
  ];
  for (const p of fbProducts) {
    const r = await addProduct({ name: p.name, brandId: fb.id, categoryId: p.cat, price: 4500, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  // ── ISSEY MIYAKE ──────────────────────────────────────────────────────────
  const issey = await upsertBrand('Issey Miyake', 'issey-miyake');
  const isseyProducts = [
    { name: 'Issey Miyake L\'Eau D\'Issey Pour Femme', cat: CAT_KADIN, notes: 'Üst: Karpuz çiçeği, Şakayık\nOrta: Yasemin, Zambak\nAlt: Sandal, Misk, Amber', desc: 'Arının üzerinde bir damla su gibi saf ve ferah, ödüllü klasik.' },
    { name: 'Issey Miyake L\'Eau Majeure', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Sudachi, Su notaları\nAlt: Sandal, Misk', desc: 'Suyun saflığını ve özgürlüğünü anlatan akvaya koku.' },
    { name: 'Issey Miyake L\'Eau Parfum', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şakayık\nOrta: Zambak, Gül\nAlt: Sandal, Misk, Amber', desc: 'L\'Eau D\'Issey\'nin daha yoğun ve kalıcı parfüm versiyonu.' },
  ];
  for (const p of isseyProducts) {
    const r = await addProduct({ name: p.name, brandId: issey.id, categoryId: p.cat, price: 3200, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: false });
    if (r) added.push(p.name);
  }

  // ── DAVIDOFF ──────────────────────────────────────────────────────────────
  const davidoff = await upsertBrand('Davidoff', 'davidoff');
  const davidoffProducts = [
    { name: 'Davidoff Cool Water EDT', cat: CAT_ERKEK, notes: 'Üst: Su akordları, Nane, Kişniş\nOrta: Yasemin, Sandal, Tobak\nAlt: Misk, Amber, Sedir', desc: 'Tüm zamanların en ikonik erkek kokusu, okyanus serinliği.' },
    { name: 'Davidoff Cool Water Woman', cat: CAT_KADIN, notes: 'Üst: Su akordları, Karpuz, Limon\nOrta: Zambak, Lotus\nAlt: Sandal, Misk, Amber', desc: 'Cool Water\'ın kadınsı yorumu, taze ve özgür.' },
    { name: 'Davidoff Hot Water', cat: CAT_ERKEK, notes: 'Üst: Zencefil, Karabiber\nOrta: Sedir, Amber\nAlt: Sandal, Misk, Deri', desc: 'Cool Water\'ın tam tersi: sıcak, yoğun ve hırslı.' },
    { name: 'Davidoff Cool Water 200ml', cat: CAT_ERKEK, notes: 'Üst: Su akordları, Nane, Kişniş\nOrta: Yasemin, Sandal\nAlt: Misk, Amber, Sedir', desc: 'Klasik Cool Water\'ın büyük boy versiyonu.' },
  ];
  for (const p of davidoffProducts) {
    const r = await addProduct({ name: p.name, brandId: davidoff.id, categoryId: p.cat, price: 3000, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: false });
    if (r) added.push(p.name);
  }

  // ── MAISON MARGIELA ───────────────────────────────────────────────────────
  const mm = await upsertBrand('Maison Margiela', 'maison-margiela');
  const mmProducts = [
    { name: 'Replica Fireplace', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Kestane\nOrta: Guaiac ağacı, Duman\nAlt: Vetiver, Kashmir, Duman', desc: 'Kış akşamı şömine başında geçirilen anları yeniden yaşatan koku.' },
    { name: 'Replica Beach Walk', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Hindistan cevizi\nOrta: Iris, Ylang\nAlt: Sandal, Misk, Ambrox', desc: 'Yaz sabahı sahil yürüyüşünün güneş kremi ve kumunu hatırlatan koku.' },
    { name: 'Replica Jazz Club', cat: CAT_UNISEX, notes: 'Üst: Rom, Pembe biber\nOrta: Kaba sığır otu, Tütün\nAlt: Sığla, Vanilya, Misk', desc: 'Gece yarısı bir caz kulübündeki duman, içki ve müziğin atmosferi.' },
    { name: 'Replica Coffee Break', cat: CAT_UNISEX, notes: 'Üst: Kahve, Bergamot\nOrta: Süt, Vanilya\nAlt: Sandal, Misk, Amber', desc: 'Sıcak bir kahvenin dumanı ve mola vaktinin rahatlığını anlatan koku.' },
    { name: 'Replica Autumn Vibes', cat: CAT_UNISEX, notes: 'Üst: Siyah kuş üzümü, Mandalin\nOrta: Patchouli, Sedir\nAlt: Amber, Sandal, Vanilya', desc: 'Sonbahar yapraklarının hışırtısını ve sıcaklığını yansıtan koku.' },
    { name: 'Replica Lemon Trees', cat: CAT_UNISEX, notes: 'Üst: Limon, Bergamot\nOrta: Mandalin, Turunç\nAlt: Sandal, Sedir, Misk', desc: 'Güney İtalya\'nın limon bahçesinde yürüyüşü anlatan ferah koku.' },
    { name: 'Replica Rain Stops', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon, Toprak\nOrta: Petrichor, Iris\nAlt: Sandal, Misk, Vetiver', desc: 'Yağmur durduğunda toprağın kokusu — petrichor\'u yakalayan koku.' },
  ];
  for (const p of mmProducts) {
    const r = await addProduct({ name: p.name, brandId: mm.id, categoryId: p.cat, price: 4000, description: p.desc, scentNotes: p.notes, isOzelKoleksiyon: true });
    if (r) added.push(p.name);
  }

  console.log('\n✅ PART 1 TAMAMLANDI');
  console.log(`Eklenen ürün sayısı: ${added.length}`);
  console.log('Eklenenler:', added.join('\n'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
