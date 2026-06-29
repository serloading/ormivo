import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

const CAT_KADIN  = '157a83bd-ac0e-4209-afbe-4a6b521c0d1c';
const CAT_ERKEK  = '1396bc28-5544-4b6e-b002-b7dbd2dc4569';
const CAT_UNISEX = '43814ff0-f64a-48cc-be2e-07fde204bce6';

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now() + Math.floor(Math.random() * 999);
}

async function getBrand(name: string) {
  return prisma.brand.findFirst({ where: { name: { contains: name, mode: 'insensitive' } } });
}

async function add(p: { name: string; brandId: string; categoryId: string; price: number; desc: string; notes: string; ozel?: boolean }) {
  const ex = await prisma.product.findFirst({ where: { name: p.name, brandId: p.brandId } });
  if (ex) return null;
  return prisma.product.create({
    data: { name: p.name, slug: slug(p.name), description: p.desc, scentNotes: p.notes, price: p.price, stock: 0, isActive: true, images: [], brandId: p.brandId, categoryId: p.categoryId, isOzelKoleksiyon: p.ozel ?? false }
  });
}

const added: string[] = [];
async function a(p: Parameters<typeof add>[0]) { const r = await add(p); if (r) added.push(p.name); }

async function main() {

  // ─ TOM FORD ───────────────────────────────────────────────────────────────
  const tf = await getBrand('Tom Ford');
  if (tf) {
    const tfProducts = [
      { name: 'Tom Ford Arabian Wood', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Çay\nOrta: Oud, Sedir, Gül\nAlt: Sandal, Amber, Misk', desc: 'Arap ormanlarının derin ve gizemli kokusu.', ozel: true },
      { name: 'Tom Ford Beau de Jour', cat: CAT_ERKEK, p: 5000, notes: 'Üst: Greyfurt, Bergamot\nOrta: Lavanta, Sedir\nAlt: Amber, Misk, Vetiver', desc: 'Güzel gün — klasik ve sofistike erkek kokusu.', ozel: true },
      { name: 'Tom Ford Cafe Rose', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Biber\nOrta: Gül, Kahve\nAlt: Sandal, Amber, Misk', desc: 'Güllerin ve kahvenin büyülü buluşması.', ozel: true },
      { name: 'Tom Ford Costa Azzurra', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Deniz tuzu, Bergamot, Limon\nOrta: Defne, Sedir\nAlt: Amber, Sandal, Misk', desc: 'Akdeniz kıyısının tuz ve doğa kokusunu yakalayan koku.', ozel: true },
      { name: 'Tom Ford Electric Cherry', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Kiraz, Bergamot\nOrta: Gül, Amber\nAlt: Sandal, Misk, Deri', desc: 'Elektrikli kirazın heyecan verici ve canlı kokusu.', ozel: true },
      { name: 'Tom Ford Fleur de Portofino', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Çiçek buketleri, Iris\nAlt: Sandal, Misk', desc: 'Portofino çiçekleri — İtalyan Rivierası\'nın tazeliği.', ozel: true },
      { name: 'Tom Ford Fougere d\'Argent', cat: CAT_ERKEK, p: 5000, notes: 'Üst: Bergamot, Lavanta\nOrta: Fern, Gül\nAlt: Sandal, Misk, Amber', desc: 'Gümüş fougere — klasik fougere geleneğinin lüks yorumu.', ozel: true },
      { name: 'Tom Ford Japon Noir', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Tütün\nAlt: Sandal, Oud, Amber', desc: 'Japon karanlığından ilham — derin ve gizemli koku.', ozel: true },
      { name: 'Tom Ford Jasmin Rouge', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Pembe biber\nOrta: Yasemin, Gül\nAlt: Deri, Sandal, Amber', desc: 'Kırmızı yasemin — duysal ve feminen başyapıt.', ozel: true },
      { name: 'Tom Ford Jasmine Musk', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Yasemin\nOrta: Yasemin, Misk\nAlt: Sandal, Amber', desc: 'Yasemin ve miskin mükemmel uyumunu yakalayan koku.', ozel: true },
      { name: 'Tom Ford Lavender Extreme', cat: CAT_ERKEK, p: 5000, notes: 'Üst: Lavanta, Bergamot\nOrta: Tütün, Amber\nAlt: Sandal, Misk, Vetiver', desc: 'Lavantanın yoğun ve maskülen yorumu.', ozel: true },
      { name: 'Tom Ford Musk Pure', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot\nOrta: Misk, Iris\nAlt: Sandal, Misk', desc: 'Saf miskin en temiz ve berrak ifadesi.', ozel: true },
      { name: 'Tom Ford Myrrhe Mystere', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Safran\nOrta: Mür, Gül\nAlt: Amber, Sandal, Misk', desc: 'Gizemli mür reçinesinin derin ve sıcak kokusu.', ozel: true },
      { name: 'Tom Ford Neroli Portofino', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Mandalin, Neroli\nOrta: Rosemary, Lavanta\nAlt: Amber, Sandal, Misk', desc: 'Portofino neroli çiçeklerinin Akdeniz tazeliği.', ozel: true },
      { name: 'Tom Ford Noir Pour Femme', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Tuberöz, Iris\nAlt: Sandal, Amber, Misk', desc: 'Karanlık feminenliğin parfüme dönüşmüş hali.', ozel: true },
      { name: 'Tom Ford Noir Extreme Parfum', cat: CAT_ERKEK, p: 5000, notes: 'Üst: Safran, Bergamot\nOrta: Gül, Dut\nAlt: Amber, Sandal, Misk', desc: 'Noir Extreme\'in en yoğun parfüm versiyonu.', ozel: true },
      { name: 'Tom Ford Orchid Soleil', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Orkide, Ylang-ylang\nAlt: Sandal, Amber, Misk', desc: 'Güneş orkidesi — canlı ve baştan çıkarıcı tropikal koku.', ozel: true },
      { name: 'Tom Ford Oud Fleur', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Safran\nOrta: Oud, Gül, Yasemin\nAlt: Amber, Sandal, Misk', desc: 'Oud ve çiçeklerin nadir ve lüks buluşması.', ozel: true },
      { name: 'Tom Ford Plum Japonais', cat: CAT_KADIN, p: 5000, notes: 'Üst: Mandalin, Erik\nOrta: Gül, Yasemin\nAlt: Sandal, Amber, Misk', desc: 'Japon eriğinin tatlı ve çiçeksi kokusu.', ozel: true },
      { name: 'Tom Ford Rose d\'Amalfi', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Amalfi kıyısının güllerini anlatan masumane koku.', ozel: true },
      { name: 'Tom Ford Rose de Chine', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Çin gülü, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Çin güllerinin zarif ve egzotik güzelliği.', ozel: true },
      { name: 'Tom Ford Santal Blush', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Sandal, Gül\nAlt: Amber, Misk, Vanilya', desc: 'Sandal ağacının sıcaklığına bürünmüş feminen koku.', ozel: true },
      { name: 'Tom Ford Soleil Blanc', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberöz, Ylang-ylang\nAlt: Hindistan cevizi, Amber, Sandal', desc: 'Beyaz güneş — yaz ve özgürlüğün parfümü.', ozel: true },
      { name: 'Tom Ford Sole di Positano', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Limon, Mandalin\nOrta: Deniz çiçeği, Defne\nAlt: Amber, Sandal, Misk', desc: 'Positano\'nun sarı güneşini taşıyan Napoli kokusu.', ozel: true },
      { name: 'Tom Ford Soleil Brulant', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberöz, Deniz notaları\nAlt: Amber, Sandal, Misk', desc: 'Yanan güneş altında deniz kenarında bir parfüm deneyimi.', ozel: true },
      { name: 'Tom Ford Soleil Beige', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberöz, Gül\nAlt: Sandal, Amber, Misk', desc: 'Bej rengi güneş — zarif ve kadifemsi koku.', ozel: true },
      { name: 'Tom Ford Soleil de Feu', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Biber\nOrta: Gül, Amber\nAlt: Sandal, Oud, Misk', desc: 'Ateş güneşi — dramatik ve güçlü bir güneş kokusu.', ozel: true },
      { name: 'Tom Ford Tobacco Oud', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Tütün, Bergamot\nOrta: Oud, Gül\nAlt: Amber, Sandal, Deri', desc: 'Tütün ve oud\'un derin ve güçlü buluşması.', ozel: true },
      { name: 'Tom Ford Tuscan Leather', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Frambuaz, Biber\nOrta: Deri, Ylang-ylang\nAlt: Suet, Amber, Sandal', desc: 'Toskana dericiliğinin görkemini anlatan ikonik parfüm.', ozel: true },
      { name: 'Tom Ford Tubereuse Nue', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Greyfurt\nOrta: Tuberöz, Gül\nAlt: Sandal, Misk, Amber', desc: 'Çıplak tuberöz — çiçeğin en saf ve açık hali.', ozel: true },
      { name: 'Tom Ford Vanille Fatale Black', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Biber\nOrta: Tütün, Amber\nAlt: Vanilya, Sandal, Misk', desc: 'Kara kaderin vanilyası — karanlık ve baştan çıkarıcı.', ozel: true },
      { name: 'Tom Ford White Patchouli', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Patchouli, Gül\nAlt: Sandal, Misk, Amber', desc: 'Beyaz patchouli — çiçeksi ve modern bir yorum.', ozel: true },
      { name: 'Tom Ford White Suede', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Gül\nOrta: Süet, Iris\nAlt: Sandal, Misk, Amber', desc: 'Beyaz süet — temiz, narin ve lüks bir koku.', ozel: true },
      { name: 'Tom Ford Ombre de Hyacinth', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Sümbül\nOrta: Sümbül, Gül\nAlt: Sandal, Misk, Amber', desc: 'Sümbülün gölgesinde dans eden zarif ve çiçeksi koku.', ozel: true },
    ];
    for (const p of tfProducts) await a({ name: p.name, brandId: tf.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ CHRISTIAN DIOR PRIVE ───────────────────────────────────────────────────
  const dior = await getBrand('Dior');
  if (dior) {
    const diorProducts = [
      // Privé koleksiyonu
      { name: 'Dior Ambre Nuit', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Greyfurt\nOrta: Amber, Gül\nAlt: Sandal, Misk', desc: 'Gece amberinin gizemli sıcaklığı.', ozel: true },
      { name: 'Dior Gris Montaigne', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Greyfurt\nOrta: Iris, Peony\nAlt: Sandal, Amber, Misk', desc: 'Montaigne caddesi gri kıyafetleri gibi zarif ve sofistike.', ozel: true },
      { name: 'Dior Bois d\'Argent', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Iris, Bergamot\nOrta: Iris, Vetiver\nAlt: Sandal, Misk', desc: 'Gümüş ormanın ışıltısını taşıyan minimalist koku.', ozel: true },
      { name: 'Dior Leather Oud', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Safran, Bergamot\nOrta: Deri, Oud\nAlt: Amber, Sandal, Misk', desc: 'Deri ve oud\'un Dior zarafetiyle buluşması.', ozel: true },
      { name: 'Dior New Look 1947', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Christian Dior\'un 1947 yılındaki devrimci New Look\'unu anlatan koku.', ozel: true },
      { name: 'Dior Oud Ispahan', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Safran, Bergamot\nOrta: Oud, Gül, Sandal\nAlt: Labdanum, Amber, Misk', desc: 'Isfahan\'ın tarihi güzelliğine adanmış zengin oud kokusu.', ozel: true },
      { name: 'Dior Oud Rosewood', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Safran\nOrta: Oud, Gül ağacı\nAlt: Amber, Sandal, Misk', desc: 'Oud ve gül ağacının nadir ve lüks uyumu.', ozel: true },
      { name: 'Dior Sakura', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Kiraz çiçeği\nOrta: Iris, Gül\nAlt: Sandal, Misk, Amber', desc: 'Japon kiraz çiçeklerinin masumiyeti ve güzelliği.', ozel: true },
      { name: 'Dior Patchouli Imperial', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Limon\nOrta: Patchouli, Gül\nAlt: Amber, Sandal, Misk', desc: 'İmparatorluk patchoulisi — zengin ve görkemli koku.', ozel: true },
      { name: 'Dior Vanilla Diorama', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Iris, Gül\nAlt: Vanilya, Amber, Sandal', desc: 'Dior zarafetiyle bezeli sıcak vanilya kokusu.', ozel: true },
      // Ana koleksiyon
      { name: 'Dior Fahrenheit Parfum', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Lavanta, Gül\nAlt: Amber, Misk, Sandal', desc: 'İkonik Fahrenheit\'ın parfüm versiyonu — daha yoğun ve kalıcı.', ozel: false },
      { name: 'Dior Homme Intense Parfum', cat: CAT_ERKEK, p: 4500, notes: 'Üst: Bergamot, Lavanta\nOrta: Iris, Kakao\nAlt: Amber, Deri, Sandal', desc: 'Dior Homme Intense\'in en güçlü parfüm versiyonu.', ozel: false },
      { name: 'Dior Sauvage EDT', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Biber\nOrta: Lavanta, Iris\nAlt: Amber, Sandal, Vetiver', desc: 'Sauvage seriesinin başlangıç noktası — taze ve güçlü.', ozel: false },
      { name: 'Dior Miss Dior EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Peony\nAlt: Sandal, Misk, Amber', desc: 'Miss Dior\'un çiçeksi parfüm versiyonu.', ozel: false },
      { name: 'Dior J\'adore EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Mandalin, Bergamot\nOrta: Gül, Yasemin, Zambak\nAlt: Sandal, Misk, Amber', desc: 'J\'adore\'un klasik eau de parfüm versiyonu.', ozel: false },
      { name: 'Dior J\'adore Infinissime', cat: CAT_KADIN, p: 4200, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Yasemin\nAlt: Sandal, Misk', desc: 'J\'adore\'un sonsuz ferahlığı ve berraklığı.', ozel: false },
      { name: 'Dior Joy EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Sevinç ve mutluluğu anlatan Dior kokusu.', ozel: false },
      { name: 'Dior Pure Poison', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Yasemin, Gül\nAlt: Sandal, Amber, Misk', desc: 'Saf zehir — cazip ve baştan çıkarıcı feminen koku.', ozel: false },
      { name: 'Dior Addict EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Çiçek notaları\nAlt: Vanilya, Amber, Misk', desc: 'Bağımlılık yaratan tatlı ve feminen koku.', ozel: false },
      { name: 'Dior Dolce Vita', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Iris\nAlt: Sandal, Vanilya, Amber', desc: 'Tatlı yaşam — Dior\'un İtalyan yaşamına sevgi selamı.', ozel: false },
    ];
    for (const p of diorProducts) await a({ name: p.name, brandId: dior.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ CREED ──────────────────────────────────────────────────────────────────
  const creed = await getBrand('Creed');
  if (creed) {
    const creedProducts = [
      { name: 'Creed Aventus Absolu', cat: CAT_ERKEK, p: 5500, notes: 'Üst: Ananas, Bergamot\nOrta: Gül, Berez ağacı\nAlt: Misk, Amber, Sandal', desc: 'Aventus\'un en yoğun ve görkemli versiyonu.', ozel: true },
      { name: 'Creed Aventus Cologne', cat: CAT_ERKEK, p: 5500, notes: 'Üst: Ananas, Bergamot, Nane\nOrta: Gül, Ardıç\nAlt: Misk, Sandal, Amber', desc: 'Aventus\'un taze ve ferah cologne versiyonu.', ozel: true },
      { name: 'Creed Green Irish Tweed', cat: CAT_ERKEK, p: 5500, notes: 'Üst: Limon, Iris kökü\nOrta: Iris, Violet yaprak\nAlt: Sandal, Amber, Misk', desc: 'İrlanda tvedini anlatan yeşil ve taze efsanevi koku.', ozel: true },
      { name: 'Creed Love in Black', cat: CAT_KADIN, p: 5500, notes: 'Üst: Bergamot, Gül yaprakları\nOrta: Gül, Violet\nAlt: Sandal, Amber, Misk', desc: 'Karanlık aşkın kadınlara armağanı.', ozel: true },
      { name: 'Creed Spring Flower', cat: CAT_KADIN, p: 5500, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Baharın ilk çiçeklerini anlatan zarif feminen koku.', ozel: true },
      { name: 'Creed White Flowers', cat: CAT_KADIN, p: 5500, notes: 'Üst: Bergamot, Turunç\nOrta: Yasemin, Tuberöz\nAlt: Sandal, Misk, Amber', desc: 'Beyaz çiçeklerin saf ve zengin bir senfonisi.', ozel: true },
      { name: 'Creed Royal Oud', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Sedir\nOrta: Oud, Gül\nAlt: Amber, Sandal, Misk', desc: 'Kraliyet oudunun Creed kalitesiyle buluşması.', ozel: true },
      { name: 'Creed Original Santal', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Mandalin\nOrta: Sandal, Iris\nAlt: Amber, Misk', desc: 'Sandal ağacının asıl güzelliğini yeniden keşfettiren koku.', ozel: true },
    ];
    for (const p of creedProducts) await a({ name: p.name, brandId: creed.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ CHANEL ─────────────────────────────────────────────────────────────────
  const chanel = await getBrand('Chanel');
  if (chanel) {
    const chanelProducts = [
      { name: 'Chanel Coco Noir', cat: CAT_KADIN, p: 4200, notes: 'Üst: Bergamot, Greyfurt\nOrta: Gül, Yasemin\nAlt: Patchouli, Sandal, Amber', desc: 'Karanlık ve baştan çıkarıcı, Coco\'nun gece versiyonu.', ozel: false },
      { name: 'Chanel Cristalle EDP', cat: CAT_KADIN, p: 4200, notes: 'Üst: Bergamot, Limon\nOrta: Iris, Yasemin\nAlt: Vetiver, Amber, Misk', desc: 'Kristal berraklığında zarif ve sofistike parfüm.', ozel: false },
      { name: 'Chanel Gabrielle EDP', cat: CAT_KADIN, p: 4200, notes: 'Üst: Mandarin, Bergamot\nOrta: Yasemin, Tuberöz\nAlt: Sandal, Misk', desc: 'Gabrielle Chanel\'e adanmış özgür ruhlu parfüm.', ozel: false },
      { name: 'Chanel No.5 EDP', cat: CAT_KADIN, p: 4500, notes: 'Üst: Neroli, Mandalin\nOrta: Gül, Yasemin\nAlt: Sandal, Amber, Vetiver', desc: 'Parfüm tarihinin en ikonik ismi, zamansız klasik.', ozel: false },
      { name: 'Chanel Allure Sensuelle', cat: CAT_KADIN, p: 4000, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris, Amber\nAlt: Vanilya, Sandal, Misk', desc: 'Duysal çekimin parfümü, Allure\'ün sıcak yorumu.', ozel: false },
      // Les Exclusifs
      { name: 'Chanel Sycomore', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Neroli\nOrta: Vetiver, Violet, Gül\nAlt: Sandal, Amber, Misk', desc: 'Çınar ağacına adanmış — Les Exclusifs serisinin şaheseri.', ozel: true },
      { name: 'Chanel Jersey', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Lavanta, Tonka fasulyesi\nAlt: Sandal, Vanilya, Misk', desc: 'Jersey kumaşının zarafetini parfüme dönüştüren koku.', ozel: true },
      { name: 'Chanel Misia', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris, Violet\nAlt: Sandal, Misk, Pudra', desc: 'Misia Sert\'e adanmış, pudralı ve feminen koku.', ozel: true },
      { name: 'Chanel Coromandel', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Patchouli, Amber\nAlt: Sandal, Misk, Benzoin', desc: 'Hindistan Koromandel kıyısından ilham alan derin ve oriental koku.', ozel: true },
    ];
    for (const p of chanelProducts) await a({ name: p.name, brandId: chanel.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ HERMES ─────────────────────────────────────────────────────────────────
  const hermes = await getBrand('Hermès');
  if (hermes) {
    const hermesProducts = [
      { name: 'Hermès Rose Ikebana', cat: CAT_KADIN, p: 4200, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Iris\nAlt: Sandal, Misk', desc: 'Japon çiçek sanatı ikebana\'dan ilham alan zarif gül kokusu.' },
      { name: 'Hermès Twilly d\'Hermes EDP', cat: CAT_KADIN, p: 4200, notes: 'Üst: Bergamot, Zencefil\nOrta: Tuberöz, Iris\nAlt: Sandal, Misk', desc: 'Genç ve enerjik Hermès kadını için taze ve çiçeksi koku.' },
      { name: 'Hermès H24 EDT', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Köknar tohumu\nOrta: Yonca, Adaçayı\nAlt: Sandal, Amber, Misk', desc: 'Gün boyunca süren bir parfüm deneyimi — taze ve maskülen.' },
      { name: 'Hermès Merveilles Ambre', cat: CAT_UNISEX, p: 4500, notes: 'Üst: Bergamot, Tuz\nOrta: Amber, Sandal\nAlt: Amber, Misk, Vetiver', desc: 'Ambre karavanının zenginliğini anlatan sıcak koku.' },
      { name: 'Hermès Caleche', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Aldehitler\nOrta: Gül, Yasemin, Iris\nAlt: Sandal, Vetiver, Misk', desc: 'Klasik Hermès zarif estetiğini yansıtan kadın klasiği.' },
    ];
    for (const p of hermesProducts) await a({ name: p.name, brandId: hermes.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ JO MALONE ──────────────────────────────────────────────────────────────
  const jo = await getBrand('Jo Malone');
  if (jo) {
    const joProducts = [
      { name: 'Jo Malone Gardenia & Oud Absolu', cat: CAT_UNISEX, p: 4800, notes: 'Üst: Bergamot\nOrta: Gardenia, Oud\nAlt: Amber, Misk', desc: 'Gardenia ve oud\'un yoğun ve nadir buluşması.', ozel: true },
      { name: 'Jo Malone Rose & White Musk Absolu', cat: CAT_KADIN, p: 4800, notes: 'Üst: Bergamot\nOrta: Gül, Beyaz misk\nAlt: Sandal, Amber', desc: 'Güllerin ve beyaz miskin mükemmel birlikteliği.', ozel: true },
      { name: 'Jo Malone Freesia & Blush Suede', cat: CAT_KADIN, p: 4200, notes: 'Üst: Bergamot, Frezya\nOrta: Gül, Süet\nAlt: Sandal, Misk', desc: 'Frezyanın tazeliği ve süetin yumuşaklığı bir arada.' },
      { name: 'Jo Malone Violet & Amber Absolu', cat: CAT_UNISEX, p: 4800, notes: 'Üst: Bergamot\nOrta: Violet, Amber\nAlt: Sandal, Misk', desc: 'Mor çiçek ve amber\'ın absolu derişimindeki birlikteliği.', ozel: true },
      { name: 'Jo Malone Wood Sage & Sea Salt', cat: CAT_UNISEX, p: 4000, notes: 'Üst: Deniz tuzu, Bergamot\nOrta: Adaçayı, Amber\nAlt: Sandal, Misk', desc: 'Deniz tuzu ve ormandaki adaçayının özgür kokusu.' },
      { name: 'Jo Malone Nectarine Blossom & Honey', cat: CAT_KADIN, p: 4000, notes: 'Üst: Nektarin, Bergamot\nOrta: Aksant, Bal\nAlt: Misk, Amber', desc: 'Tatlı nektarin çiçeği ve doğal bal uyumu.' },
      { name: 'Jo Malone Wild Bluebell', cat: CAT_KADIN, p: 4000, notes: 'Üst: Bergamot, Limon\nOrta: Yabani çan çiçeği, Iris\nAlt: Sandal, Misk', desc: 'Yabani çan çiçeklerinin özgür doğa kokusu.' },
      { name: 'Jo Malone Moonlit Camomile Cologne', cat: CAT_UNISEX, p: 4500, notes: 'Üst: Bergamot, Papatya\nOrta: Elma, Iris\nAlt: Misk, Amber, Sandal', desc: 'Ay ışığında papatya tarlalarının huzurlu kokusu.', ozel: true },
    ];
    for (const p of joProducts) await a({ name: p.name, brandId: jo.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ FREDERIC MALLE ─────────────────────────────────────────────────────────
  const fm = await getBrand('Frederic Malle');
  if (fm) {
    const fmProducts = [
      { name: 'Frederic Malle Carnal Flower', cat: CAT_KADIN, p: 5500, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberöz, Misk\nAlt: Sandal, Kokos, Amber', desc: 'Etsel çiçek — tuberöz\'ün en içten ve duysal yorumu.', ozel: true },
      { name: 'Frederic Malle Rose & Cuir', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Pembe biber\nOrta: Gül, Deri\nAlt: Sandal, Misk, Amber', desc: 'Gül ve deri — karşıtların zarifçe bir araya gelişi.', ozel: true },
      { name: 'Frederic Malle Musc Ravageur', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Mandalin\nOrta: Lavanta, Vanilya\nAlt: Misk, Amber, Deri', desc: 'Yıkıcı misk — duysal ve bağımlılık yapıcı misk parfümü.', ozel: true },
      { name: 'Frederic Malle Superstitious', cat: CAT_KADIN, p: 5500, notes: 'Üst: Bergamot, Mandalin\nOrta: Iris, Gül\nAlt: Sandal, Misk, Amber', desc: 'Alber Elbaz imzalı batıl inançların çekici kokusu.', ozel: true },
      { name: 'Frederic Malle Portrait of a Lady', cat: CAT_KADIN, p: 5500, notes: 'Üst: Bergamot, Karabiber\nOrta: Gül, Patchouli\nAlt: Sandal, Amber, Misk', desc: 'Bir hanım portresi — büyük Fransız parfümeri sanatının zirvesi.', ozel: true },
      { name: 'Frederic Malle French Lover', cat: CAT_ERKEK, p: 5500, notes: 'Üst: Bergamot, Karabiber\nOrta: Galbanum, Iris\nAlt: Vetiver, Misk, Amber', desc: 'Fransız aşığının maskülen ve çekici kokusu.', ozel: true },
    ];
    for (const p of fmProducts) await a({ name: p.name, brandId: fm.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ JEAN PAUL GAULTIER ─────────────────────────────────────────────────────
  const jpg = await getBrand('Jean Paul Gaultier');
  if (jpg) {
    const jpgProducts = [
      { name: 'JPG Classique Intense W', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Vanilya, Amber', desc: 'Classique\'in yoğun ve baştan çıkarıcı versiyonu.' },
      { name: 'JPG Scandal By Night W', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Bal\nOrta: Gül, Tuberöz\nAlt: Amber, Sandal, Misk', desc: 'Scandal\'ın gece partileri için yarı-oryantal versiyonu.' },
      { name: 'JPG Scandal Gold W', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Yasemin\nAlt: Amber, Sandal, Vanilya', desc: 'Altın skandal — özel koleksiyon parıltısı.' },
      { name: 'JPG So Scandal W', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Şeftali\nOrta: Tuberöz, Gül\nAlt: Vanilya, Amber, Sandal', desc: 'Bu kadar skandal — Scandal serisinin taze yüzü.' },
      { name: 'JPG Le Male Elixir Extrait', cat: CAT_ERKEK, p: 4200, notes: 'Üst: Bergamot, Lavanta\nOrta: Kakao, Iris\nAlt: Amber, Vanilya, Sandal', desc: 'Le Male\'in en yoğun extrait versiyonu — kalıcı ve güçlü.', ozel: true },
      { name: 'JPG La Belle Fleur Terrible W', cat: CAT_KADIN, p: 4000, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris, Peony\nAlt: Sandal, Amber, Misk', desc: 'Korkunç güzel çiçek — feminen gücü anlatan koku.' },
      { name: 'JPG Le Male Intense', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Lavanta\nOrta: Vanilya, Amber\nAlt: Sandal, Misk, Deri', desc: 'Le Male serisinin en yoğun ve maskülen yorumu.' },
      { name: 'JPG Le Male Aviator', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Lavanta\nOrta: Iris, Amber\nAlt: Sandal, Misk, Deri', desc: 'Pilot ruhunu taşıyan maceraperest erkek kokusu.' },
      { name: 'JPG Le Beau Paradise Fall', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Hindistan cevizi, Bergamot\nOrta: Tonka fasulyesi, Amber\nAlt: Sandal, Misk', desc: 'Cennetin sonbaharında şeker ağacı altında dinlenmek.' },
      { name: 'JPG JPG 2 EDP', cat: CAT_UNISEX, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'JPG\'nin ikonik iki parfümünü tek şişede buluşturan koku.' },
      { name: 'JPG Scandal Intense M', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Elma\nOrta: Lavanta, Iris\nAlt: Amber, Sandal, Misk', desc: 'Erkek skandalının en yoğun ve cesur versiyonu.' },
      { name: 'JPG Classique Pride Edition', cat: CAT_KADIN, p: 4000, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Vanilya, Amber', desc: 'Gururla — renklerin ve çeşitliliğin kutlandığı özel baskı.' },
      { name: 'JPG Madame EDP', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Yasemin\nAlt: Sandal, Amber, Misk', desc: 'Madame — feminen zarafeti JPG estetiğiyle birleştiren koku.' },
    ];
    for (const p of jpgProducts) await a({ name: p.name, brandId: jpg.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ GUERLAIN ───────────────────────────────────────────────────────────────
  const guerlain = await getBrand('Guerlain');
  if (guerlain) {
    const guerlainProducts = [
      { name: 'Guerlain La Petite Robe Noire EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Kiraz\nAlt: Patchouli, Vanilya, Amber', desc: 'Küçük siyah elbise — moda ve parfümün buluştuğu nokta.' },
      { name: 'Guerlain Aqua Allegoria Bergamote Calabria', cat: CAT_UNISEX, p: 3500, notes: 'Üst: Bergamot, Limon\nOrta: Beyaz çiçekler\nAlt: Misk, Sandal', desc: 'Calabria bergamotunun taze ve canlı kokusu.' },
      { name: 'Guerlain Aqua Allegoria Mandarine Basilic', cat: CAT_UNISEX, p: 3500, notes: 'Üst: Mandalin, Bergamot\nOrta: Fesleğen, Gül\nAlt: Misk, Sandal', desc: 'Mandalin ve fesleğenin ferah Akdeniz senfonisi.' },
      { name: 'Guerlain Samsara EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Limon\nOrta: Sandal, Yasemin, Iris\nAlt: Sandal, Vanilya, Amber', desc: 'Ruhun döngüsünü anlatan derin ve oriental koku.' },
      { name: 'Guerlain Mon Guerlain EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Lavanta, Bergamot\nOrta: Vanilya, Sandal\nAlt: Vanilya, Amber, Misk', desc: 'Benim Guerlain\'im — özgür ve tutkulu kadına adanmış koku.' },
      { name: 'Guerlain L\'Homme Ideal EDP', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Badem\nOrta: Lavanta, Iris\nAlt: Sandal, Amber, Misk', desc: 'İdeal adam — maskülen ve sofistike erkek parfümü.' },
      { name: 'Guerlain Ideal EDP', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Badem\nOrta: Lavanta, Vanilya\nAlt: Sandal, Amber, Misk', desc: 'Erkek ideali — sıcak ve güçlü parfüm.' },
      { name: 'Guerlain Insolence EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Gül, Iris\nOrta: Violet, Gül\nAlt: Sandal, Misk, Amber', desc: 'Küstahlık — canlı ve feminen kışkırtıcı bir koku.' },
    ];
    for (const p of guerlainProducts) await a({ name: p.name, brandId: guerlain.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ CHLOÉ ──────────────────────────────────────────────────────────────────
  const chloe = await getBrand('Chloé');
  if (chloe) {
    const chloeProducts = [
      { name: 'Chloé Love Story EDP', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Limon\nOrta: Portakal çiçeği, Gül\nAlt: Sandal, Misk, Amber', desc: 'Aşk hikayesi — Chloé\'nin romantik ve çiçeksi yorumu.' },
      { name: 'Chloé Nomade Nuit d\'Egypte', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Turunç\nOrta: Gül, Mısır yasemin\nAlt: Sandal, Misk, Amber', desc: 'Mısır gecesinde gezginin duyguları.' },
      { name: 'Chloé Nomade Absolu', cat: CAT_KADIN, p: 4000, notes: 'Üst: Bergamot, Şeftali\nOrta: Meşe yosunu, Gül\nAlt: Sandal, Misk, Amber', desc: 'Nomad\'ın absolu versiyonu — yoğun ve kalıcı.', ozel: true },
      { name: 'Chloé Naturelle EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Gül\nOrta: Gül, Magnolya\nAlt: Misk, Sandal', desc: 'Doğal ve organik malzemelerle yaratılan temiz koku.' },
      { name: 'Chloé Lumineuse EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Parlak ve ışıltılı — ışık dolu bir feminen koku.' },
    ];
    for (const p of chloeProducts) await a({ name: p.name, brandId: chloe.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ GIVENCHY ───────────────────────────────────────────────────────────────
  const givenchy = await getBrand('Givenchy');
  if (givenchy) {
    const givenchyProducts = [
      { name: 'Givenchy Ange ou Demon EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Greyfurt\nOrta: Gül, Sandal\nAlt: Amber, Vetiver, Misk', desc: 'Melek mi yoksa şeytan mı — ikilem içindeki kadın parfümü.' },
      { name: 'Givenchy L\'Interdit Absolu', cat: CAT_KADIN, p: 4200, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberöz, Gül\nAlt: Amber, Sandal, Misk', desc: 'Yasak\'ın absolu versiyonu — yoğun ve karanlık.', ozel: true },
      { name: 'Givenchy Gentleman Intense', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Limon\nOrta: Lavanta, Iris\nAlt: Amber, Sandal, Vetiver', desc: 'Centilmen yoğun — sofistike erkek karakterini anlatan koku.' },
      { name: 'Givenchy Rose Velvet', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Peony\nAlt: Sandal, Amber, Misk', desc: 'Kadife gül — dokunmak isteyeceğiniz kadifemsi feminen koku.' },
    ];
    for (const p of givenchyProducts) await a({ name: p.name, brandId: givenchy.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ GUCCI ──────────────────────────────────────────────────────────────────
  const gucci = await getBrand('Gucci');
  if (gucci) {
    const gucciProducts = [
      { name: 'Gucci Bloom Intense EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberöz, Gül, Rangoon creeper\nAlt: Sandal, Amber, Misk', desc: 'Bloom\'un en yoğun ve derin feminen versiyonu.' },
      { name: 'Gucci Premiere EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Galada kırmızı halının üzerindeki güç ve zarafet.' },
      { name: 'Gucci Rush EDP', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Freesia\nOrta: Tuberöz, Gül\nAlt: Patchouli, Vanilya, Sandal', desc: 'Özgür ruhun tutkusunu anlatan dinamik feminen koku.' },
      { name: 'Gucci Envy Me EDT', cat: CAT_KADIN, p: 3500, notes: 'Üst: Mandalin, Bergamot\nOrta: Gül, Lotus\nAlt: Sandal, Amber, Misk', desc: 'Beni kıskan — özgüveni ve cazibesi yüksek kadın kokusu.' },
      { name: 'Gucci Guilty Pour Femme Intense EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Peony\nAlt: Amber, Vanilya, Patchouli', desc: 'Guilty\'nin yoğun feminen versiyonu.' },
    ];
    for (const p of gucciProducts) await a({ name: p.name, brandId: gucci.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ CAROLINA HERRERA ───────────────────────────────────────────────────────
  const ch = await getBrand('Carolina Herrera');
  if (ch) {
    const chProducts = [
      { name: 'CH 212 VIP NYC EDP', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Peony\nAlt: Amber, Sandal, Misk', desc: 'New York\'un VIP hayatının parfümü.' },
      { name: 'CH 212 VIP Men Rose EDP', cat: CAT_ERKEK, p: 3500, notes: 'Üst: Bergamot, Gül\nOrta: Lavanta, Kakao\nAlt: Amber, Sandal, Misk', desc: 'VIP erkek için özel gül yorumu.' },
      { name: 'CH Bad Boy EDP', cat: CAT_ERKEK, p: 3500, notes: 'Üst: Bergamot, Biber\nOrta: Lavanta, Kakao\nAlt: Amber, Sandal, Vetiver', desc: 'Kötü çocuğun çekici maskülenliği.' },
      { name: 'CH Bad Boy Cobalt EDP', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Kafur\nOrta: Lavanta, Kakao\nAlt: Amber, Sandal, Vetiver', desc: 'Kobalt mavi — Bad Boy\'un elektrikli versiyonu.' },
      { name: 'CH Good Girl Legere EDP', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberöz, Yasemin\nAlt: Tonka fasulyesi, Amber, Sandal', desc: 'İyi kızın hafif ve taze yorumu.' },
      { name: 'CH Good Girl Blush EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris\nAlt: Tonka fasulyesi, Amber, Sandal', desc: 'İyi kızın pembemsi ve pembe yanağı.' },
      { name: 'CH Good Girl Glorious Gold EDP', cat: CAT_KADIN, p: 4000, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberöz, Yasemin\nAlt: Tonka fasulyesi, Amber, Sandal', desc: 'Altın iyi kız — özel koleksiyon butiği.' },
    ];
    for (const p of chProducts) await a({ name: p.name, brandId: ch.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ BURBERRY ───────────────────────────────────────────────────────────────
  const burberry = await getBrand('Burberry');
  if (burberry) {
    const burberryProducts = [
      { name: 'Burberry Her EDP Intense', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Çilek, Kırmızı meyveler\nAlt: Misk, Amber, Sandal', desc: 'Her\'in yoğun ve meyvemsi versiyonu.' },
      { name: 'Burberry Goddess Intense EDP', cat: CAT_KADIN, p: 4000, notes: 'Üst: Lavanta, Bergamot\nOrta: Vanilya, Gül\nAlt: Amber, Sandal, Misk', desc: 'Tanrıçanın yoğun versiyonu — derin ve kadifemsi.' },
      { name: 'Burberry My Burberry Black EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Yasemin\nAlt: Patchouli, Sandal, Amber', desc: 'Siyah — modern Burberry kadının geceleri.' },
      { name: 'Burberry My Burberry Classic EDP', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Yasemin\nAlt: Sandal, Amber, Misk', desc: 'Klassik Burberry bahar yağmurunu anlatan koku.' },
      { name: 'Burberry Mr. Burberry EDP', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Greyfurt\nOrta: Adaçayı, Sandal\nAlt: Amber, Vetiver, Sandal', desc: 'Bay Burberry — modern ve sofistike İngiliz erkek kokusu.' },
      { name: 'Burberry Weekend For Women EDP', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Lavanta\nAlt: Sandal, Misk, Amber', desc: 'Hafta sonu özgürlüğü — kadın için taze ve rahat koku.' },
      { name: 'Burberry Touch For Men EDT', cat: CAT_ERKEK, p: 3200, notes: 'Üst: Bergamot, Mandalin\nOrta: Lavanta, Sedir\nAlt: Sandal, Amber, Misk', desc: 'Dokunuş — hafif ve taze İngiliz erkek kokusu.' },
      { name: 'Burberry Brit For Men EDT', cat: CAT_ERKEK, p: 3200, notes: 'Üst: Bergamot, Zencefil\nOrta: Sandal, Lavanta\nAlt: Amber, Misk, Tonka fasulyesi', desc: 'Genç İngiliz ruhunu anlatan dinamik erkek kokusu.' },
    ];
    for (const p of burberryProducts) await a({ name: p.name, brandId: burberry.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ BVLGARI ────────────────────────────────────────────────────────────────
  const bvlgari = await getBrand('Bvlgari');
  if (bvlgari) {
    const bvlgariProducts = [
      { name: 'Bvlgari Man in Black EDP', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Amber\nAlt: Amber, Deri, Sandal', desc: 'Siyah içindeki adamın güçlü ve çekici kokusu.' },
      { name: 'Bvlgari Man in Black Limited', cat: CAT_ERKEK, p: 4200, notes: 'Üst: Bergamot, Safran\nOrta: Oud, Gül\nAlt: Amber, Deri, Sandal', desc: 'Siyah Adam\'ın sınırlı özel baskısı.', ozel: true },
      { name: 'Bvlgari Goldea EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Yasemin\nAlt: Sandal, Amber, Misk', desc: 'Altın tanrıça — parlak ve feminen.' },
      { name: 'Bvlgari Goldea The Roman Night EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Bergamot\nOrta: Gül, Yasemin\nAlt: Amber, Sandal, Misk', desc: 'Roma gecelerinde altın tanrıça.' },
      { name: 'Bvlgari Omnia Crystalline EDT', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Bambu\nOrta: Lotus çiçeği, Sandal\nAlt: Misk, Amber', desc: 'Kristal saflığında berrak ve taze feminen koku.' },
      { name: 'Bvlgari BLV Pour Homme EDT', cat: CAT_ERKEK, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Iris, Sandal\nAlt: Amber, Misk, Vetiver', desc: 'Mavi — maskülen ferahlık ve sofistike bütünlük.' },
      { name: 'Bvlgari Rose Essentielle EDT', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Özgün gül — Bvlgari zarifiyle gülün özü.' },
      { name: 'Bvlgari Aqva Marine Pour Homme EDT', cat: CAT_ERKEK, p: 3200, notes: 'Üst: Bergamot, Deniz notaları\nOrta: Deniz yosunu, Amber\nAlt: Sandal, Misk, Vetiver', desc: 'Deniz mavisi — derin okyanus tazeliği.' },
    ];
    for (const p of bvlgariProducts) await a({ name: p.name, brandId: bvlgari.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ CALVIN KLEIN ───────────────────────────────────────────────────────────
  const ck = await getBrand('Calvin Klein');
  if (ck) {
    const ckProducts = [
      { name: 'CK Beauty EDP W', cat: CAT_KADIN, p: 3200, notes: 'Üst: Bergamot, Gül\nOrta: Iris, Gül\nAlt: Sandal, Misk, Amber', desc: 'Güzelliğin en saf hali — minimalist feminen parfüm.' },
      { name: 'CK One Shock For Her EDT', cat: CAT_KADIN, p: 3200, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Çilek\nAlt: Sandal, Misk, Amber', desc: 'Şok dalgası — CK One\'ın feminen yorumu.' },
      { name: 'CK Eternity Now For Men EDT', cat: CAT_ERKEK, p: 3200, notes: 'Üst: Bergamot, Kaktüs\nOrta: Gül, Sedir\nAlt: Amber, Sandal, Misk', desc: 'Şimdiki an — Eternity serisinin taze maskülen yorumu.' },
      { name: 'CK Eternity Now For Women EDT', cat: CAT_KADIN, p: 3200, notes: 'Üst: Bergamot, Bergamot\nOrta: Gül, Lotus\nAlt: Misk, Sandal, Amber', desc: 'Şimdiki an — Eternity serisinin taze feminen yorumu.' },
      { name: 'CK CKin2U For Him EDT', cat: CAT_ERKEK, p: 3000, notes: 'Üst: Bergamot, Karabiber\nOrta: Kafur, Sedir\nAlt: Amber, Misk, Sandal', desc: 'Teknoloji ve doğanın erkeksi buluşması.' },
      { name: 'CK CKin2U For Her EDT', cat: CAT_KADIN, p: 3000, notes: 'Üst: Bergamot, Elma\nOrta: Lotus, Yasemin\nAlt: Misk, Amber, Sandal', desc: 'Teknoloji ve güzelliğin feminen yorumu.' },
    ];
    for (const p of ckProducts) await a({ name: p.name, brandId: ck.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ NARCISO RODRIGUEZ ──────────────────────────────────────────────────────
  const narciso = await getBrand('Narciso Rodriguez');
  if (narciso) {
    const narcisoProducts = [
      { name: 'Narciso Rodriguez For Her Forever EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Misk\nAlt: Sandal, Amber', desc: 'Sonsuza dek — zamansız feminen koku.' },
      { name: 'Narciso Rodriguez For Her Irise EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Iris, Misk\nAlt: Sandal, Amber', desc: 'Iris ile bezeli, ipeksi ve zarif misk kokusu.' },
      { name: 'Narciso Rodriguez Fleur Musc Noir EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Misk\nAlt: Siyah misk, Sandal', desc: 'Karanlık çiçek miskin saf kokusu.' },
      { name: 'Narciso Rodriguez For Her Pink Edition EDT', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Gül\nOrta: Misk, Gül\nAlt: Sandal, Amber', desc: 'Pembe edisyon — taze ve masumane feminen yorum.' },
      { name: 'Narciso Rodriguez Musc Nude EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot\nOrta: Misk, Gül\nAlt: Sandal, Amber', desc: 'Çıplak misk — saflığın ve sadeliğin parfümü.' },
      { name: 'Narciso Rodriguez Narciso Crystal EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Misk, Gül\nAlt: Sandal, Amber, Sedir', desc: 'Kristal saflığında misk ve gülün buluşması.' },
      { name: 'Narciso Rodriguez For Him Neroli Ambre EDT', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Neroli, Bergamot\nOrta: Amber, Misk\nAlt: Sandal, Vetiver', desc: 'Neroli ve amber ile bezeli sofistike erkek kokusu.' },
      { name: 'Narciso Rodriguez All Of Me EDP Intense', cat: CAT_KADIN, p: 4000, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Misk\nAlt: Sandal, Amber, Misk', desc: 'Tüm benliğimle — yoğun ve baştan çıkarıcı feminen parfüm.' },
    ];
    for (const p of narcisoProducts) await a({ name: p.name, brandId: narciso.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ DOLCE & GABBANA ────────────────────────────────────────────────────────
  const dg = await getBrand('Dolce & Gabbana');
  if (dg) {
    const dgProducts = [
      { name: 'D&G King EDT', cat: CAT_ERKEK, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Tonka fasulyesi, Iris\nAlt: Sandal, Misk, Amber', desc: 'Kral — güçlü ve asil erkek kokusu.' },
      { name: 'D&G L\'Imperatrice EDT', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Karpuz\nOrta: Çilek, Gül\nAlt: Sandal, Misk, Amber', desc: 'İmparatoriçe — meyvemsi ve ferah feminen koku.' },
      { name: 'D&G Light Blue Summer Vibes W EDT', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Hindistan cevizi\nOrta: Çiçek, Deniz\nAlt: Sandal, Misk, Amber', desc: 'Yaz titreşimleri — Light Blue\'nun sınırlı yaz edisyonu.' },
      { name: 'D&G The Only One Red EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Viole\nOrta: Iris, Violet\nAlt: Sandal, Misk, Amber', desc: 'Kırmızı tek — The Only One\'ın tutkulu kırmızı yorumu.' },
      { name: 'D&G My Devotion EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Bağlılığım — adanmışlığı anlatan zarif feminen koku.' },
    ];
    for (const p of dgProducts) await a({ name: p.name, brandId: dg.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ PACO RABANNE ───────────────────────────────────────────────────────────
  const paco = await getBrand('Paco Rabanne');
  if (paco) {
    const pacoProducts = [
      { name: 'Paco Rabanne Fame EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Mimoza, Gül\nAlt: Sandal, Misk, Amber', desc: 'Ün ve şöhretin baştan çıkarıcı feminen kokusu.' },
      { name: 'Paco Rabanne Fame Parfum', cat: CAT_KADIN, p: 4200, notes: 'Üst: Bergamot, Mandalin\nOrta: Mimoza, Gül\nAlt: Sandal, Amber, Misk', desc: 'Fame\'in en yoğun parfüm versiyonu.' },
      { name: 'Paco Rabanne Invictus Intense EDP', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Greyfurt\nOrta: Amber, Defne\nAlt: Amber, Sandal, Vetiver', desc: 'Yenilmez yoğun — Invictus\'un güçlendirilmiş hali.' },
      { name: 'Paco Rabanne Black XS EDP', cat: CAT_ERKEK, p: 3500, notes: 'Üst: Bergamot, Biber\nOrta: Sedir, Iris\nAlt: Deri, Amber, Misk', desc: 'Karanlık aşırılık — cesur ve asi genç kokusu.' },
      { name: 'Paco Rabanne Phantom Parfum', cat: CAT_ERKEK, p: 4200, notes: 'Üst: Bergamot, Lavanta\nOrta: Tonka fasulyesi, Gül\nAlt: Amber, Sandal, Misk', desc: 'Hayalet parfüm — en güçlü versiyon.', ozel: true },
      { name: 'Paco Rabanne Phantom Legion EDT', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Lavanta\nOrta: Tonka, Sedir\nAlt: Amber, Sandal, Misk', desc: 'Lejyon harekâtı — güçlü maskülen koku.' },
      { name: 'Paco Rabanne Pure XS EDP', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Zencefil\nOrta: Lavanta, Sedir\nAlt: Amber, Sandal, Misk', desc: 'Saf aşırılık — maskülen tutku ve güç.' },
      { name: 'Paco Rabanne Olympea Blossom EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Frangipani, Gül\nAlt: Sandal, Misk, Amber', desc: 'Olympus çiçeği — tanrıça feminen yorumu.' },
      { name: 'Paco Rabanne Olympea Solar EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Tuberoz, Iris\nAlt: Sandal, Amber, Misk', desc: 'Güneş olimpiyatı — ışıltılı feminen koku.' },
    ];
    for (const p of pacoProducts) await a({ name: p.name, brandId: paco.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ HUGO BOSS ──────────────────────────────────────────────────────────────
  const hugo = await getBrand('Hugo Boss');
  if (hugo) {
    const hugoProducts = [
      { name: 'Hugo Boss Bottled Sport EDT', cat: CAT_ERKEK, p: 3200, notes: 'Üst: Bergamot, Greyfurt\nOrta: Lavanta, Sedir\nAlt: Amber, Sandal, Misk', desc: 'Spor ruhuyla dolu dinamik erkek kokusu.' },
      { name: 'Hugo Boss Bottled Infinite EDP', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Lavanta, Iris\nAlt: Amber, Sandal, Misk', desc: 'Sonsuz — Bottled serisinin sofistike parfüm yorumu.' },
      { name: 'Hugo Boss Bottled Grey EDP', cat: CAT_ERKEK, p: 3500, notes: 'Üst: Bergamot, Greyfurt\nOrta: Lavanta, Sedir\nAlt: Amber, Sandal, Misk', desc: 'Gri — Bottled serisinin sofistike ve sade yorumu.' },
      { name: 'Hugo Boss Bottled EDP', cat: CAT_ERKEK, p: 3500, notes: 'Üst: Bergamot, Elma\nOrta: Lavanta, Sedir\nAlt: Amber, Sandal, Misk', desc: 'Bottled\'ın parfüm formatı — daha yoğun ve derin.' },
      { name: 'Hugo Boss Hugo Man EDP', cat: CAT_ERKEK, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Lavanta, Sedir\nAlt: Amber, Sandal, Misk', desc: 'Hugo Man\'ın parfüm versiyonu.' },
      { name: 'Hugo Boss The Scent For Her EDP', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Şeftali\nOrta: Manolya, Cehri\nAlt: Amber, Sandal, Misk', desc: 'Onun için koku — çekici ve duysal feminen parfüm.' },
      { name: 'Hugo Boss The Scent Magnetic W EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Şeftali\nOrta: Manolya, Gül\nAlt: Amber, Sandal, Misk', desc: 'Manyetik çekim — feminin cazibenin parfümü.' },
    ];
    for (const p of hugoProducts) await a({ name: p.name, brandId: hugo.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ MUGLER ─────────────────────────────────────────────────────────────────
  const mugler = await getBrand('Mugler');
  if (mugler) {
    const muglerProducts = [
      { name: 'Mugler Alien Goddess Intense EDP', cat: CAT_KADIN, p: 4000, notes: 'Üst: Bergamot, Mandalin\nOrta: Yasemin, Heliotrope\nAlt: Sandal, Amber, Misk', desc: 'Alien Goddess\'ın en yoğun ve baştan çıkarıcı yorumu.' },
      { name: 'Mugler Aura EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Amber\nAlt: Sandal, Vetiver, Misk', desc: 'Aura — feminen sıcaklık ve ışıltının kokusu.' },
      { name: 'Mugler Angel Nova EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Misk\nAlt: Sandal, Amber', desc: 'Nova melek — Angel serisinin çiçeksi taze yorumu.' },
      { name: 'Mugler Angel Elixir EDP', cat: CAT_KADIN, p: 4000, notes: 'Üst: Bergamot, Çikolata\nOrta: Yıldız anason, Bal\nAlt: Patchouli, Vanilya, Amber', desc: 'Angel iksiri — klasiğin daha yoğun büyülü versiyonu.' },
      { name: 'Mugler Alien Man EDP', cat: CAT_ERKEK, p: 3800, notes: 'Üst: Bergamot, Sedir\nOrta: Amber, Misk\nAlt: Sandal, Vetiver', desc: 'Yabancı adam — güçlü ve çekici maskülen koku.' },
    ];
    for (const p of muglerProducts) await a({ name: p.name, brandId: mugler.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ AZZARO ─────────────────────────────────────────────────────────────────
  const azzaro = await getBrand('Azzaro');
  if (azzaro) {
    await a({ name: 'Azzaro The Most Wanted Intense EDP', brandId: azzaro.id, categoryId: CAT_ERKEK, price: 3500, desc: 'En çok istenilenin yoğun versiyonu — güçlü ve çekici.', notes: 'Üst: Bergamot, Limon\nOrta: Lavanta, Tonka\nAlt: Amber, Sandal, Misk' });
    await a({ name: 'Azzaro Chrome EDP', brandId: azzaro.id, categoryId: CAT_ERKEK, price: 3500, desc: 'Chrome\'un parfüm versiyonu — daha yoğun ve uzun kalıcı.', notes: 'Üst: Bergamot, Deniz notaları\nOrta: Lavanta, Seder\nAlt: Amber, Sandal, Misk' });
    await a({ name: 'Azzaro Wanted Limited Edition EDP', brandId: azzaro.id, categoryId: CAT_ERKEK, price: 3800, desc: 'Wanted\'ın özel sınırlı baskı versiyonu.', notes: 'Üst: Bergamot, Limon\nOrta: Lavanta, Geranium\nAlt: Amber, Sandal, Vetiver' });
    await a({ name: 'Azzaro Forever United EDP', brandId: azzaro.id, categoryId: CAT_UNISEX, price: 3500, desc: 'Sonsuza kadar birleşmiş — Azzaro\'nun unisex çifti.', notes: 'Üst: Bergamot, Narenciye\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk' });
  }

  // ─ KENZO ──────────────────────────────────────────────────────────────────
  const kenzo = await getBrand('Kenzo');
  if (kenzo) {
    await a({ name: 'Kenzo L\'Eau Pour Femme EDT', brandId: kenzo.id, categoryId: CAT_KADIN, price: 3200, desc: 'Kenzo\'nun ferah ve doğa ilhamlı kadın kokusu.', notes: 'Üst: Bergamot, Limon\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber' });
    await a({ name: 'Kenzo Homme EDT', brandId: kenzo.id, categoryId: CAT_ERKEK, price: 3200, desc: 'Erkek için Kenzo — taze ve aromatik erkek kokusu.', notes: 'Üst: Bergamot, Nane\nOrta: Lavanta, Sedir\nAlt: Amber, Sandal, Vetiver' });
    await a({ name: 'Kenzo Flower By Kenzo EDP', brandId: kenzo.id, categoryId: CAT_KADIN, price: 3500, desc: 'Kenzo çiçeği — şehrin ortasında bir yaban çiçeği.', notes: 'Üst: Bergamot, Violet\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber' });
  }

  // ─ MONTBLANC ──────────────────────────────────────────────────────────────
  const montblanc = await getBrand('Montblanc');
  if (montblanc) {
    await a({ name: 'Montblanc Legend Black EDP', brandId: montblanc.id, categoryId: CAT_ERKEK, price: 3500, desc: 'Efsanenin siyah gece versiyonu — güçlü ve gizemli.', notes: 'Üst: Bergamot, Biber\nOrta: Lavanta, Iris\nAlt: Amber, Sandal, Misk' });
    await a({ name: 'Montblanc Legend Red EDP', brandId: montblanc.id, categoryId: CAT_ERKEK, price: 3500, desc: 'Efsanenin kırmızı tutkulu versiyonu — cesur ve dinamik.', notes: 'Üst: Bergamot, Elma\nOrta: Lavanta, Gül\nAlt: Amber, Sandal, Misk' });
  }

  // ─ MOSCHINO ───────────────────────────────────────────────────────────────
  const moschino = await getBrand('Moschino');
  if (moschino) {
    await a({ name: 'Moschino Toy Boy EDP', brandId: moschino.id, categoryId: CAT_ERKEK, price: 3500, desc: 'Oyun çocuğu — tatlı, güçlü ve Moschino\'ya özgü erkek kokusu.', notes: 'Üst: Bergamot, Safran\nOrta: Gül, Iris\nAlt: Amber, Sandal, Deri' });
    await a({ name: 'Moschino Toy 2 EDT', brandId: moschino.id, categoryId: CAT_KADIN, price: 3200, desc: 'Oyuncak 2 — taze ve eğlenceli feminen koku.', notes: 'Üst: Bergamot, Lavanta\nOrta: Iris, Gül\nAlt: Misk, Sandal, Amber' });
  }

  // ─ LOUIS VUITTON ──────────────────────────────────────────────────────────
  const lv = await getBrand('Louis Vuitton');
  if (lv) {
    const lvProducts = [
      { name: 'LV Coeur Battant EDP', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Peony\nAlt: Sandal, Misk, Amber', desc: 'Çarpan kalp — romantik ve feminen Louis Vuitton.', ozel: true },
      { name: 'LV Rose des Vents EDP', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Rüzgar gülü — serüvenin ve özgürlüğün parfümü.', ozel: true },
      { name: 'LV Spell on You EDP', cat: CAT_KADIN, p: 5000, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Büyü yap — baştan çıkarıcı ve gizemli.', ozel: true },
      { name: 'LV Pur Oud EDP', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Safran, Bergamot\nOrta: Oud, Gül\nAlt: Amber, Sandal, Misk', desc: 'Saf oud — LV\'nin en lüks oud yorumu.', ozel: true },
    ];
    for (const p of lvProducts) await a({ name: p.name, brandId: lv.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ ROBERTO CAVALLI ────────────────────────────────────────────────────────
  const rc = await getBrand('Roberto Cavalli');
  if (rc) {
    const rcProducts = [
      { name: 'Roberto Cavalli Paradiso EDT W', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Cennet — taze ve çiçeksi Akdeniz feminen kokusu.' },
      { name: 'Roberto Cavalli Paradiso Absolut EDP W', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Bergamot\nOrta: Gül, Tuberöz\nAlt: Sandal, Amber, Misk', desc: 'Cennet absolut — daha yoğun ve baştan çıkarıcı versiyon.' },
      { name: 'Roberto Cavalli Acqua EDT W', cat: CAT_KADIN, p: 3200, notes: 'Üst: Bergamot, Narenciye\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Su — saf ve taze Akdeniz kokusu.' },
      { name: 'Roberto Cavalli Exotica EDT W', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Hindistan cevizi\nOrta: Frangipani, Yasemin\nAlt: Sandal, Amber, Misk', desc: 'Egzotik — tropikal adalara yolculuk.' },
      { name: 'Roberto Cavalli Nero Assoluto W EDP', cat: CAT_KADIN, p: 3800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Patchouli, Sandal, Amber', desc: 'Mutlak siyah — karanlık ve sofistike feminen koku.' },
    ];
    for (const p of rcProducts) await a({ name: p.name, brandId: rc.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ MAISON CRIVELLI ────────────────────────────────────────────────────────
  const mc = await getBrand('Maison Crivelli');
  if (mc) {
    await a({ name: 'Maison Crivelli Patchouli Magnetik EDP', brandId: mc.id, categoryId: CAT_UNISEX, price: 4800, desc: 'Manyetik patchouli — güçlü ve çekici niche koku.', notes: 'Üst: Bergamot, Biber\nOrta: Patchouli, Gül\nAlt: Amber, Sandal, Misk', ozel: true });
    await a({ name: 'Maison Crivelli Hibiscus Mahajad EDP', brandId: mc.id, categoryId: CAT_KADIN, price: 4800, desc: 'Hibiscus mahajad — egzotik ve taze çiçeksi koku.', notes: 'Üst: Bergamot, Hibiscus\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', ozel: true });
  }

  // ─ MARC JACOBS ────────────────────────────────────────────────────────────
  const mj = await getBrand('Marc Jacobs');
  if (mj) {
    const mjProducts = [
      { name: 'Marc Jacobs So Decadence EDP', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Bu kadar çürüklük — eğlenceli ve canlı feminen koku.' },
      { name: 'Marc Jacobs Daisy EDP', cat: CAT_KADIN, p: 3200, notes: 'Üst: Çilek, Gül yaprakları\nOrta: Gül, Viyolet\nAlt: Sandal, Beyaz misk, Vanilya', desc: 'Papatya — taze, neşeli ve genç feminen parfüm.' },
      { name: 'Marc Jacobs Daisy Love EDP', cat: CAT_KADIN, p: 3500, notes: 'Üst: Bulut Berry, Mandalin\nOrta: Papatya, Gül\nAlt: Sandal, Driftwood, Misk', desc: 'Papatya aşkı — yaz macerası ve özgür ruh.' },
      { name: 'Marc Jacobs Daisy Eau So Fresh EDT', cat: CAT_KADIN, p: 3200, notes: 'Üst: Ahududu, Grapefruit\nOrta: Gül, Violet\nAlt: Sandal, Misk, Amber', desc: 'Daisy\'nin taze ve çiçeksi yorumu.' },
    ];
    for (const p of mjProducts) await a({ name: p.name, brandId: mj.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes });
  }

  // ─ KAJAL ──────────────────────────────────────────────────────────────────
  const kajal = await getBrand('Kajal');
  if (kajal) {
    const kajalProducts = [
      { name: 'Kajal White EDP', cat: CAT_UNISEX, p: 4200, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Beyaz — saflık ve temizliğin parfümü.', ozel: true },
      { name: 'Kajal Almaz EDP', cat: CAT_UNISEX, p: 4200, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Oud\nAlt: Amber, Sandal, Misk', desc: 'Elmas — değerli taşlar gibi nadide koku.', ozel: true },
      { name: 'Kajal Dahab EDP', cat: CAT_UNISEX, p: 4200, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Sandal\nAlt: Oud, Amber, Misk', desc: 'Altın — parlak ve sıcak oriental koku.', ozel: true },
      { name: 'Kajal Gold EDP', cat: CAT_UNISEX, p: 4500, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Oud\nAlt: Amber, Altın sandal, Misk', desc: 'Altın hazine — lüks oriental kokusu.', ozel: true },
      { name: 'Kajal Masa EDP', cat: CAT_UNISEX, p: 4200, notes: 'Üst: Bergamot, Tuz\nOrta: Gül, Amber\nAlt: Sandal, Misk, Oud', desc: 'Masa — çölün genişliğini anlatan oriental koku.', ozel: true },
    ];
    for (const p of kajalProducts) await a({ name: p.name, brandId: kajal.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ KAYALI ─────────────────────────────────────────────────────────────────
  const kayali = await getBrand('Kayali');
  if (kayali) {
    await a({ name: 'Kayali Invite Only Amber 23 EDP', brandId: kayali.id, categoryId: CAT_UNISEX, price: 4200, desc: 'Sadece davetli — amber\'in en seçkin ifadesi.', notes: 'Üst: Bergamot, Safran\nOrta: Amber, Gül\nAlt: Sandal, Oud, Misk', ozel: true });
    await a({ name: 'Kayali Vanilla 28 EDP', brandId: kayali.id, categoryId: CAT_UNISEX, price: 3800, desc: 'Vanilyalı yumuşak, sıcak ve sarmaleyici koku.', notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Vanilya, Amber, Sandal' });
  }

  // ─ CASAMORATI ─────────────────────────────────────────────────────────────
  const casa = await getBrand('Casamorati');
  if (casa) {
    await a({ name: 'Casamorati Dama Bianca EDP', brandId: casa.id, categoryId: CAT_KADIN, price: 4200, desc: 'Beyaz bayan — İtalyan parfümeri geleneğinin şiirsel kokusu.', notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', ozel: true });
    await a({ name: 'Casamorati Italica EDP', brandId: casa.id, categoryId: CAT_UNISEX, price: 4500, desc: 'Italica — Roma İmparatorluğu\'nun izini süren tarihi koku.', notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris, Sandal\nAlt: Amber, Misk', ozel: true });
    await a({ name: 'Casamorati Casa Futura EDP', brandId: casa.id, categoryId: CAT_UNISEX, price: 4200, desc: 'Gelecek ev — gelenekle modernin şiirsel buluşması.', notes: 'Üst: Bergamot, Mandalin\nOrta: Sandal, Amber\nAlt: Misk, Vetiver', ozel: true });
  }

  // ─ CLIVE CHRISTIAN ────────────────────────────────────────────────────────
  const clive = await getBrand('Clive Christian');
  if (clive) {
    await a({ name: 'Clive Christian Noble VII Amber', brandId: clive.id, categoryId: CAT_UNISEX, price: 5500, desc: 'Asil VII — Clive Christian\'ın Amber serisinin görkemli yorumu.', notes: 'Üst: Bergamot, Safran\nOrta: Gül, Amber\nAlt: Sandal, Oud, Misk', ozel: true });
    await a({ name: 'Clive Christian Leather Box EDP', brandId: clive.id, categoryId: CAT_UNISEX, price: 5500, desc: 'Deri kutu — nadide ve luxe özel koleksiyon parfümü.', notes: 'Üst: Bergamot, Safran\nOrta: Deri, Gül\nAlt: Amber, Oud, Sandal', ozel: true });
  }

  // ─ MARC-ANTOINE BARROIS ───────────────────────────────────────────────────
  const mab = await getBrand('Marc-Antoine Barrois');
  if (mab) {
    const mabProducts = [
      { name: 'Marc-Antoine Barrois Tilia EDP', cat: CAT_KADIN, p: 4800, notes: 'Üst: Bergamot, Ihlamur\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Ihlamur ağacı — baharın en tatlı çiçeksi kokusu.', ozel: true },
      { name: 'Marc-Antoine Barrois B683 Extrait', cat: CAT_UNISEX, p: 5000, notes: 'Üst: Bergamot, Biber\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'B683 numaralı formülün extrait versiyonu — yoğun ve kompleks.', ozel: true },
      { name: 'Marc-Antoine Barrois Aldebaran EDP', cat: CAT_UNISEX, p: 4800, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Aldebaran yıldızından ilham alan parlak ve güçlü koku.', ozel: true },
      { name: 'Marc-Antoine Barrois Ganymede EDP', cat: CAT_ERKEK, p: 4800, notes: 'Üst: Bergamot, Limon\nOrta: Iris, Sandal\nAlt: Amber, Misk, Sedir', desc: 'Ganymedes — Jüpiter\'in uydusuna adanmış, neredeyse parfüm.', ozel: true },
      { name: 'Marc-Antoine Barrois Ganymede Extrait', cat: CAT_ERKEK, p: 5000, notes: 'Üst: Bergamot, Limon\nOrta: Iris, Sandal\nAlt: Amber, Misk, Vetiver', desc: 'Ganymede\'ın extrait versiyonu — en yoğun ve kalıcı hali.', ozel: true },
    ];
    for (const p of mabProducts) await a({ name: p.name, brandId: mab.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ MARKA ARAMALARI ────────────────────────────────────────────────────────
  // Bazı markalar farklı isimle kayıtlı olabilir, alternatif arama

  // MARC JACOBS alternatif kontrol
  const mjAlt = await getBrand('Marc Jacobs');
  if (!mjAlt) {
    console.log('⚠️  Marc Jacobs bulunamadı — marka adını kontrol et');
  }

  console.log('\n✅ PART 3 TAMAMLANDI');
  console.log(`Eklenen: ${added.length}`);
  console.log(added.join('\n'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
