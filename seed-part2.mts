import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

const CAT_KADIN = '157a83bd-ac0e-4209-afbe-4a6b521c0d1c';
const CAT_ERKEK = '1396bc28-5544-4b6e-b002-b7dbd2dc4569';
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
  // ─ XERJOFF (mevcut marka, eksik ürünler) ──────────────────────────────────
  const xj = await getBrand('Xerjoff');
  if (xj) {
    const xjProducts = [
      { name: 'Xerjoff Alexandra Uden', cat: CAT_KADIN, p: 5500, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Alexandra serisinin feminen ve şiirsel yorumu.', ozel: true },
      { name: 'Xerjoff Amabile', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'İtalyanca sevimli anlamına gelen, narin ve çekici koku.', ozel: true },
      { name: 'Xerjoff Ambe', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot\nOrta: Sandal, Gül\nAlt: Amber, Misk', desc: 'Amberin sıcaklığını ve derinliğini yansıtan lüks koku.', ozel: true },
      { name: 'Xerjoff Comandante', cat: CAT_ERKEK, p: 5500, notes: 'Üst: Bergamot, Karabiber\nOrta: Gül, Sandal\nAlt: Amber, Oud, Deri', desc: 'Komutanın gücünü ve otoritesini yansıtan güçlü erkek kokusu.', ozel: true },
      { name: 'Xerjoff Ouverture', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Bir müzikal açılış gibi, tüm duyuları harekete geçiren koku.', ozel: true },
      { name: 'Xerjoff Cruz Del Sur II', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Deniz notaları\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Güney Haçı takım yıldızına adanmış ikinci gökyüzü kokusu.', ozel: true },
      { name: 'Xerjoff 1986', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris, Sandal\nAlt: Amber, Misk', desc: '1986 yılını ve hatıralarını onurlandıran vintage ruhlu koku.', ozel: true },
      { name: 'Xerjoff 49 Knots', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Deniz tuzu, Bergamot\nOrta: Marine notalar, Iris\nAlt: Sandal, Amber, Misk', desc: '49 knot hızda açık denizin özgürlüğünü yaşatan koku.', ozel: true },
      { name: 'Xerjoff Golden Dallah', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Safran, Bergamot\nOrta: Oud, Gül\nAlt: Amber, Misk, Sandal', desc: 'Altın dallah (Arap kahve ibriği) ilhamlı zengin Orta Doğu kokusu.', ozel: true },
      { name: 'Xerjoff Naxos', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Limon, Lavanta\nOrta: Tütün, Bal, Tonka fasulyesi\nAlt: Vetiver, Sığla, Misk', desc: 'Yunan adasına adanmış, balın ve tütünün sıcaklığını yaşatan koku.', ozel: true },
      { name: 'Xerjoff Muse', cat: CAT_KADIN, p: 5500, notes: 'Üst: Bergamot, Pembe biber\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'İlham perisi Muse\'ye adanmış, yaratıcılığı uyandıran feminen koku.', ozel: true },
      { name: 'Xerjoff Star Musk', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot\nOrta: Gül, Iris\nAlt: Yıldız misği, Sandal, Amber', desc: 'Yıldız ışığı kadar berrak ve büyüleyici bir misk yorumu.', ozel: true },
      { name: 'Xerjoff Soprano', cat: CAT_KADIN, p: 5500, notes: 'Üst: Bergamot, Turunç\nOrta: Gül, Iris, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Sopranonun yükselen sesini müzikal bir parfüme dönüştüren koku.', ozel: true },
      { name: 'Xerjoff Kostas', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Yunan adaları\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Yunanistan sevgisini ve Ege\'nin güzelliğini anlatan koku.', ozel: true },
      { name: 'Xerjoff Laylati', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Safran, Bergamot\nOrta: Oud, Gül, Sandal\nAlt: Amber, Misk, Deri', desc: 'Arapça "Gecelerim" anlamında, Doğu gecelerinin büyüsü.', ozel: true },
      { name: 'Xerjoff Renaissance', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Sandal, Iris\nAlt: Amber, Misk', desc: 'Rönesans\'ın sanat ve güzellik anlayışına adanmış koku.', ozel: true },
      { name: 'Xerjoff Decas', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'On yılın özel kutlaması için yaratılan lüks koku.', ozel: true },
      { name: 'Xerjoff Torino 21', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Greyfurt\nOrta: Gül, Iris, Sandal\nAlt: Amber, Misk, Vetiver', desc: 'Turin\'in 21. çağrışımıyla kentsel lüksü yansıtan koku.', ozel: true },
      { name: 'Xerjoff Torino 22', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Sandal\nAlt: Amber, Misk, Sedir', desc: 'Turin şehrinin ikinci anıtsal yorumu.', ozel: true },
      { name: 'Xerjoff Torino 23', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Limon\nOrta: Iris, Gül\nAlt: Sandal, Misk, Amber', desc: 'Turin serisinin üçüncü eseri, şehrin dinamizmini yansıtır.', ozel: true },
      { name: 'Xerjoff Alexandra III', cat: CAT_KADIN, p: 5500, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris\nAlt: Sandal, Misk, Vanilya', desc: 'Alexandra serisinin üçüncü ve en olgun yorumu.', ozel: true },
      { name: 'Xerjoff Torino 24', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Greyfurt\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Turin\'in 24 saatini kapsayan tam bir şehir deneyimi.', ozel: true },
      { name: 'Xerjoff Groove Cape', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Deniz notaları\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Cape Town\'ın canlı müzik sahnesini ve özgürlüğünü yansıtan koku.', ozel: true },
      { name: 'Xerjoff Anniversary Homme', cat: CAT_ERKEK, p: 5500, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Sandal\nAlt: Amber, Misk, Vetiver', desc: 'Xerjoff\'un kuruluş yıldönümüne adanmış özel erkek kokusu.', ozel: true },
      { name: 'Xerjoff Co-Existance', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Birlikte var olmayı kutlayan uyumlu ve zarif koku.', ozel: true },
      { name: 'Xerjoff La Capitale', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Iris, Sandal\nAlt: Amber, Misk', desc: 'Başkentlerin ihtişamına adanmış, asil ve güçlü bir koku.', ozel: true },
      { name: 'Xerjoff Louis 1722', cat: CAT_UNISEX, p: 5500, notes: 'Üst: Bergamot, Sandal\nOrta: Gül, Iris\nAlt: Amber, Oud, Misk', desc: 'Louis XIV döneminin ihtişamına adanmış tarihi bir koku.', ozel: true },
    ];
    for (const p of xjProducts) await a({ name: p.name, brandId: xj.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: p.ozel });
  }

  // ─ TIZIANA TERENZI (eksik ürünler) ────────────────────────────────────────
  const tt = await getBrand('Tiziana Terenzi');
  if (tt) {
    const ttProducts = [
      { name: 'Tiziana Terenzi Cubia', cat: CAT_UNISEX, notes: 'Üst: Turunç, Mandalin\nOrta: Gül, Iris, Sandal\nAlt: Amber, Misk, Oud', desc: 'Denizin kıvrımlı yolculuğunu anlatan lüks unisex koku.', p: 5000 },
      { name: 'Tiziana Terenzi Poggia', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'İtalyan kırsalının doğa kokularından ilham alan taze koku.', p: 5000 },
      { name: 'Tiziana Terenzi Atlantide', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Deniz tuzları\nOrta: Iris, Gül\nAlt: Sandal, Misk, Amber', desc: 'Kayıp kıta Atlantis\'in gizemini yansıtan derin ve tarihi koku.', p: 5000 },
      { name: 'Tiziana Terenzi Borelli', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Gül, Sandal\nAlt: Amber, Oud, Misk', desc: 'İtalyan ustalığını modern yorumla buluşturan koku.', p: 5000 },
      { name: 'Tiziana Terenzi Orza', cat: CAT_UNISEX, notes: 'Üst: Mandalin, Bergamot\nOrta: Gül, Tuberoz\nAlt: Sandal, Amber, Misk', desc: 'Orza yıldız kümesine adanmış kozmik bir yolculuk.', p: 5000 },
      { name: 'Tiziana Terenzi Extacy', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Iris, Sandal\nAlt: Amber, Misk, Oud', desc: 'Büyüleyici ve doruk noktasını taşıyan duygusal bir koku.', p: 5000 },
      { name: 'Tiziana Terenzi Kristina', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris, Yasemin\nAlt: Sandal, Misk, Vanilya', desc: 'Kristina adına adanmış, narin ve zarif feminen koku.', p: 5000 },
      { name: 'Tiziana Terenzi Draco', cat: CAT_UNISEX, notes: 'Üst: Karabiber, Bergamot\nOrta: Oud, Gül, Sandal\nAlt: Amber, Deri, Misk', desc: 'Draco yıldız takımının güçlü ve dramatik enerjisi.', p: 5000 },
      { name: 'Tiziana Terenzi Laudano Nero', cat: CAT_UNISEX, notes: 'Üst: Tütün, Bergamot\nOrta: Sandal, Gül\nAlt: Oud, Amber, Deri', desc: 'Siyah laudanum\'un yoğun ve gizemli büyüsü.', p: 5000 },
      { name: 'Tiziana Terenzi Orion', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Greyfurt\nOrta: Lavanta, Gül\nAlt: Sandal, Amber, Vetiver', desc: 'Avcı takımyıldızı Orion\'a adanmış maskülen ve güçlü koku.', p: 5000 },
      { name: 'Tiziana Terenzi Casanova', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Ünlü aşık Casanova\'nın ruhunu taşıyan çekici erkek kokusu.', p: 5000 },
      { name: 'Tiziana Terenzi Porpora', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Iris, Sandal\nAlt: Amber, Misk', desc: 'Mor-kırmızı imparatorluk rengiyle bezenmiş asil koku.', p: 5000 },
      { name: 'Tiziana Terenzi Oud Alshain', cat: CAT_UNISEX, notes: 'Üst: Safran, Bergamot\nOrta: Oud, Gül\nAlt: Amber, Deri, Misk', desc: 'Alshain yıldızından ilham, zengin oud harmonisi.', p: 5000 },
      { name: 'Tiziana Terenzi Spirito Fiorentino', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Floransa ruhunu taşıyan, Rönesans sanatından ilham alan koku.', p: 5000 },
      { name: 'Tiziana Terenzi Telea', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Iris, Gül, Tuberoz\nAlt: Amber, Sandal, Misk', desc: 'Telea yıldızının büyülü ışığını anlatan koku.', p: 5000 },
      { name: 'Tiziana Terenzi Ursa', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Amber, Misk', desc: 'Büyük Ayı takımyıldızına adanmış güçlü ve sıcak koku.', p: 5000 },
      { name: 'Tiziana Terenzi Alioth', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Gül, Sandal\nAlt: Amber, Misk, Vetiver', desc: 'Büyük Ayı\'nın en parlak yıldızına adanmış ışıltılı koku.', p: 5000 },
      { name: 'Tiziana Terenzi Wirtanem', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Iris, Gül\nAlt: Sandal, Amber, Misk', desc: 'Wirtanem kuyruklu yıldızından ilham alan kozmik koku.', p: 5000 },
      { name: 'Tiziana Terenzi Al Contrario', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Gül, Sandal\nAlt: Amber, Oud, Misk', desc: 'Tersine çevrilmiş geleneklerin yarattığı beklenmedik güzellik.', p: 5000 },
    ];
    for (const p of ttProducts) await a({ name: p.name, brandId: tt.id, categoryId: p.cat, price: p.p, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ ORTO PARISI (eksik) ────────────────────────────────────────────────────
  const op = await getBrand('Orto Parisi');
  if (op) {
    const opProducts = [
      { name: 'Orto Parisi Bergamask', cat: CAT_UNISEX, notes: 'Üst: Bergamot\nOrta: Misk, Amber\nAlt: Vetiver, Sedir', desc: 'Bergamotun saf güzelliğini misk ile harmanlayan avant-garde koku.' },
      { name: 'Orto Parisi Cuoim', cat: CAT_UNISEX, notes: 'Üst: Deri, Bergamot\nOrta: Tütün, Gül\nAlt: Oud, Deri, Amber', desc: 'Ham derinin özgünlüğünü yücelten deri parfüm şaheseri.' },
      { name: 'Orto Parisi Boccanera', cat: CAT_UNISEX, notes: 'Üst: Mandalin, Bergamot\nOrta: Karabiber, Gül\nAlt: Deri, Amber, Misk', desc: 'Kara ağızın provokasyonunu taşıyan karanlık ve çarpıcı koku.' },
      { name: 'Orto Parisi Megamare', cat: CAT_UNISEX, notes: 'Üst: Deniz tuzu, Deniz yosunu\nOrta: Marine, Amber\nAlt: Misk, Vetiver', desc: 'Büyük okyanus derinliklerini yakalamanın yolu.' },
      { name: 'Orto Parisi Brutus', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Karabiber\nOrta: Tütün, Gül\nAlt: Deri, Oud, Misk', desc: 'Brutus karakterinin trajik gücünü anlatan yoğun erkek kokusu.' },
      { name: 'Orto Parisi Seminalis', cat: CAT_UNISEX, notes: 'Üst: Topraksı notalar, Bergamot\nOrta: Misk, Amber\nAlt: Vetiver, Sedir', desc: 'Tohumların ve doğanın yaratıcı gücünden ilham.' },
      { name: 'Orto Parisi Terroni', cat: CAT_UNISEX, notes: 'Üst: Toprak, Bergamot\nOrta: Vetiver, Amber\nAlt: Sedir, Misk', desc: 'İtalyan toprağının sıcaklığını ve ruhunu yansıtan koku.' },
      { name: 'Orto Parisi Viride', cat: CAT_UNISEX, notes: 'Üst: Yeşil yapraklar, Bergamot\nOrta: Lavanta, Iris\nAlt: Sandal, Misk', desc: 'Doğanın yeşil nefesini yakalayan ferah ve natürel koku.' },
    ];
    for (const p of opProducts) await a({ name: p.name, brandId: op.id, categoryId: p.cat, price: 4800, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ NASOMATTO (eksik) ──────────────────────────────────────────────────────
  const naso = await getBrand('Nasomatto');
  if (naso) {
    const nasoProducts = [
      { name: 'Nasomatto Sadonaso', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Gül, Sandal\nAlt: Deri, Oud, Amber', desc: 'Sado-naso çelişkisini parfüme dönüştüren cesur ve provokasyon dolu koku.' },
      { name: 'Nasomatto Blamage', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Ananas\nOrta: Gül, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Rezillliğin tuhaf güzelliğini kucaklayan alaycı parfüm.' },
      { name: 'Nasomatto Absinth', cat: CAT_UNISEX, notes: 'Üst: Pelin otu, Anason\nOrta: Lavanta, Gül\nAlt: Misk, Amber, Sandal', desc: 'Pelin otunun büyüleyici ve uyuşturucu dünyasına yapılan yolculuk.' },
      { name: 'Nasomatto Baraonda', cat: CAT_UNISEX, notes: 'Üst: Gül, Bergamot\nOrta: Iris, Deri\nAlt: Oud, Amber, Misk', desc: 'Kaos ve güzelliğin birleşimini anlatan deneysel koku.' },
      { name: 'Nasomatto Duro', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Karabiber\nOrta: Tütün, Sandal\nAlt: Deri, Oud, Amber', desc: 'Sert ve güçlü, uzlaşmaz maskülenliği temsil eden parfüm.' },
      { name: 'Nasomatto Fantomas', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Amber, Sandal, Misk', desc: 'Maskeli gizemli kahramanın izinden yürüyen fantastik koku.' },
      { name: 'Nasomatto Narcotic V', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Tuberoz\nAlt: Misk, Vanilya, Amber', desc: 'V harfinin feminen gücünü taşıyan, bağımlılık yapıcı çiçeksi koku.' },
      { name: 'Nasomatto Nuda', cat: CAT_KADIN, notes: 'Üst: Bergamot, Iris\nOrta: Gül, Misk\nAlt: Sandal, Vanilya', desc: 'Çıplaklığın ve saflığın misk gibi tanımlanması.' },
      { name: 'Nasomatto Nodiflorim', cat: CAT_KADIN, notes: 'Üst: Tuberöz, Bergamot\nOrta: Iris, Gül\nAlt: Misk, Sandal, Amber', desc: 'Tuberöz çiçeğinin düğümünden açılan saf güzellik.' },
    ];
    for (const p of nasoProducts) await a({ name: p.name, brandId: naso.id, categoryId: p.cat, price: 4800, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ BYREDO (eksik) ─────────────────────────────────────────────────────────
  const byredo = await getBrand('Byredo');
  if (byredo) {
    const byredoProducts = [
      { name: 'Byredo Casablanca Lily', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Greyfurt\nOrta: Zambak, Sümbül\nAlt: Sandal, Misk, Amber', desc: 'Casablanca\'nın büyülü zambaklarından ilham alan romantik koku.' },
      { name: 'Byredo Black Narcotique', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Nergis, Gül\nAlt: Amber, Deri, Misk', desc: 'Siyah nergis çiçeğinin karanlık ve çekici tarafını anlatan koku.' },
      { name: 'Byredo Flowerhead', cat: CAT_KADIN, notes: 'Üst: Gül, Turunç\nOrta: Zambak, Peony, Nergis\nAlt: Sandal, Misk', desc: 'Hint düğün çiçeklerinden ilham, tam bir çiçekler senfonisi.' },
      { name: 'Byredo Blanche', cat: CAT_KADIN, notes: 'Üst: Pembe biber, Greyfurt\nOrta: Gül, Peony, Iris\nAlt: Sandal, Misk, Amber', desc: 'Beyaz çiçeklerin saflığını ve masumiyetini yakalayan koku.' },
      { name: 'Byredo Gypsy Water', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon, Nane\nOrta: Iris, Ardıç\nAlt: Sandal, Amber, Misk', desc: 'Roman hayatının özgürlüğünü ve doğa sevgisini anlatan koku.' },
      { name: 'Byredo Marijuana', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Greyfurt\nOrta: Tütün çiçeği, Amber\nAlt: Sandal, Misk, Deri', desc: 'Tütünün şiirsel yorumunu sunan sanatsal Byredo imzası.' },
      { name: 'Byredo Rouge Chaotique', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Pembe biber\nOrta: Gül, Sandal\nAlt: Amber, Deri, Misk', desc: 'Kırmızının kaotik enerjisini yakalamanın parfüm hali.' },
      { name: 'Byredo Mojave Ghost', cat: CAT_UNISEX, notes: 'Üst: Greyfurt, Nardus otu\nOrta: Magnolya, Mavi sandal\nAlt: Amber, Sandal, Misk', desc: 'Mojave çölünde hayalet gibi dolaşan bir koku deneyimi.' },
      { name: 'Byredo Sellier', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Deri, Gül\nAlt: Amber, Oud, Misk', desc: 'At eyeri dericisinden ilham, asil ve güçlü bir deri kokusu.' },
      { name: 'Byredo Reine De Nuit', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Gece zambağı, Gül\nAlt: Amber, Sandal, Misk', desc: 'Gecenin kraliçesi — yalnızca gece açan çiçeklerin büyüsü.' },
      { name: 'Byredo Super Cedar', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Gül\nOrta: Sandal, Amber\nAlt: Sedir, Misk, Vetiver', desc: 'Sedirin saf gücünü öne çıkaran minimal ve etkili koku.' },
      { name: 'Byredo Tobacco Mandarin', cat: CAT_UNISEX, notes: 'Üst: Mandalin, Bergamot\nOrta: Tütün, Amber\nAlt: Sandal, Misk, Deri', desc: 'Tütünün sıcaklığını mandarin tazeliğiyle harmanlayan koku.' },
      { name: 'Byredo Velvet Haze', cat: CAT_UNISEX, notes: 'Üst: Ahu gözü, Bergamot\nOrta: Gül, Sandal\nAlt: Amber, Misk, Vanilya', desc: 'Kadife bir sisin içinde kaybolmanın büyülü kokusu.' },
      { name: 'Byredo Vanille Antique', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Vanilya, Amber, Sandal', desc: 'Antika bir vanilyanın derinliğini ve zenginliğini anlatan koku.' },
    ];
    for (const p of byredoProducts) await a({ name: p.name, brandId: byredo.id, categoryId: p.cat, price: 4800, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ MEMO PARIS (eksik) ─────────────────────────────────────────────────────
  const memo = await getBrand('Memo');
  if (memo) {
    const memoProducts = [
      { name: 'Memo French Leather', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Deri, Gül\nAlt: Amber, Oud, Misk', desc: 'Fransız dericiliğinin zarafetini özüne katan lüks koku.' },
      { name: 'Memo Argentina', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Mimoza\nAlt: Sandal, Misk, Amber', desc: 'Arjantin\'in tutkusunu ve pampa genişliğini anlatan koku.' },
      { name: 'Memo Flam', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Sandal\nAlt: Amber, Oud, Misk', desc: 'Ateşin tutkusunu ve ısısını yansıtan dinamik koku.' },
      { name: 'Memo Iberian Leather', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Deri, Sandal\nAlt: Amber, Oud, Misk', desc: 'İber Yarımadası\'nın zengin deri geleneğine adanmış koku.' },
      { name: 'Memo Ilha Do Mel', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Hindistan cevizi\nOrta: Frangipani, Gül\nAlt: Sandal, Misk, Amber', desc: 'Brezilya\'nın bal adasının sıcaklığını anlatan tropikal koku.' },
      { name: 'Memo Kedu', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Java adasının Kedu ovasının bereketli kokularından ilham.' },
      { name: 'Memo Italian Leather', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Deri, Gül\nAlt: Amber, Sandal, Misk', desc: 'İtalyan dericiliğinin inceliğini ve ustalığını yansıtan koku.' },
      { name: 'Memo Lalibela', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Incense, Gül\nAlt: Oud, Amber, Sandal', desc: 'Etiyopya\'nın kutsal şehri Lalibela\'dan ilham alan dini ve mistik koku.' },
      { name: 'Memo Russian Leather', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber, Mandalin\nOrta: Deri, Huş ağacı\nAlt: Amber, Oud, Deri', desc: 'Rusya\'nın deri işleme geleneğinden ilham alan güçlü ve sıcak koku.' },
    ];
    for (const p of memoProducts) await a({ name: p.name, brandId: memo.id, categoryId: p.cat, price: 4800, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ MAISON FRANCIS KURKDJIAN (eksik) ──────────────────────────────────────
  const mfk = await getBrand('Maison Francis Kurkdjian');
  if (mfk) {
    const mfkProducts = [
      { name: 'MFK APOM Pour Femme', cat: CAT_KADIN, notes: 'Üst: Bergamot, Pembe biber\nOrta: Gül, Iris\nAlt: Misk, Sandal, Amber', desc: 'À pas de Muse — müzün adımlarını kadın için izleyen koku.' },
      { name: 'MFK APOM Pour Homme', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Karabiber\nOrta: Lavanta, Sandal\nAlt: Misk, Amber, Vetiver', desc: 'À pas de Muse — ilham perisinin erkek yorumu.' },
      { name: 'MFK Lumiere Noire Pour Femme', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Deri', desc: 'Karanlık ışığın feminen yorumu.' },
      { name: 'MFK Lumiere Noire Pour Homme', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Karabiber\nOrta: Sandal, Iris\nAlt: Misk, Deri, Amber', desc: 'Karanlık ışığın maskülen yorumu.' },
      { name: 'MFK Ala Rose', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Gül üzerine gül, kusursuz bir gül parfümü.' },
      { name: 'MFK Aqua Celestia', cat: CAT_UNISEX, notes: 'Üst: Blackcurrant, Bergamot\nOrta: Mimoza, Lotus çiçeği\nAlt: Sandal, Misk', desc: 'Göksel suların temiz ve özgür kokusunu taşıyan koku.' },
      { name: 'MFK Amyris Femme', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Amyris ağacı, Sandal, Misk', desc: 'Amyris ağacının feminen yorumu.' },
      { name: 'MFK Amyris Homme', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Karabiber\nOrta: Iris, Sandal\nAlt: Amyris ağacı, Misk, Amber', desc: 'Amyris ağacının maskülen yorumu.' },
      { name: 'MFK Oud Satin Extrait', cat: CAT_UNISEX, notes: 'Üst: Safran, Bergamot\nOrta: Gül, Oud\nAlt: Amber, Deri, Misk', desc: 'Oud Satin Mood\'un en yoğun extrait versiyonu.' },
      { name: 'MFK Baccarat Rouge Extrait', cat: CAT_UNISEX, notes: 'Üst: Safran, Yasemin\nOrta: Ambrowood, Fir reçinesi\nAlt: Amber, Cedar', desc: 'Baccarat Rouge 540\'ın en güçlü extrait de parfüm versiyonu.' },
      { name: 'MFK Baccarat Petit Matin', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Altın ihlamur\nOrta: Iris, Gül\nAlt: Sandal, Misk, Amber', desc: 'Erken sabahın berrak ışığında yeniden doğuş.' },
      { name: 'MFK Grand Soir 200ml', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Amber, Labdanum\nAlt: Benzoin, Vanilya, Sandal', desc: 'Grand Soir\'ın büyük boy versiyonu.' },
    ];
    for (const p of mfkProducts) await a({ name: p.name, brandId: mfk.id, categoryId: p.cat, price: 5500, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ MANCERA (eksik) ────────────────────────────────────────────────────────
  const mancera = await getBrand('Mancera');
  if (mancera) {
    const manceraProducts = [
      { name: 'Mancera Cedrat Boise', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon, Sedir\nOrta: Sandal, Vetiver\nAlt: Deri, Misk, Amber', desc: 'Nişan almış, ormanlık bir sitronenin zarif ve kalıcı kokusu.' },
      { name: 'Mancera Tonka Cola', cat: CAT_UNISEX, notes: 'Üst: Cola, Mandalin\nOrta: Tonka fasulyesi, Gül\nAlt: Amber, Vanilya, Misk', desc: 'Tonka fasulyesinin sıcaklığıyla cola tazeliğini harmanlayan eğlenceli koku.' },
      { name: 'Mancera Roses Vanille', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Zambak\nAlt: Vanilya, Amber, Misk', desc: 'Taze güllerle kadifemsi vanilyayı buluşturan çekici kadın parfümü.' },
      { name: 'Mancera Wild Python', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Deri, Sandal\nAlt: Amber, Oud, Misk', desc: 'Yılan derisi kadar egzotik ve çekici, vahşi ve özgür bir koku.' },
      { name: 'Mancera Aoud Lemon Mint', cat: CAT_UNISEX, notes: 'Üst: Limon, Nane, Bergamot\nOrta: Oud, Gül\nAlt: Amber, Misk, Sandal', desc: 'Oud\'un derinliğini limon ve nane serinliğiyle buluşturan ferah koku.' },
      { name: 'Mancera French Riviera', cat: CAT_UNISEX, notes: 'Üst: Greyfurt, Bergamot\nOrta: Lavanta, Gül\nAlt: Sandal, Misk, Amber', desc: 'Fransız Rivierası\'nın mavi gökyüzü ve deniz kokusu.' },
    ];
    for (const p of manceraProducts) await a({ name: p.name, brandId: mancera.id, categoryId: p.cat, price: 4000, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ PARFUMS DE MARLY (eksik) ───────────────────────────────────────────────
  const pdm = await getBrand('Parfums de Marly');
  if (pdm) {
    const pdmProducts = [
      { name: 'PDM Athalia', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali, Pembe biber\nOrta: Gül, Yasemin, Iris\nAlt: Misk, Sandal, Amber', desc: 'Feminen güç ve zarafetin parfümü, güçlü kadınlara adanmış.' },
      { name: 'PDM Safanad', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris, Yasemin\nAlt: Misk, Sandal, Amber', desc: 'Saf ve zarif, kraliyet ailesinin kızlarına adanmış koku.' },
      { name: 'PDM Darcy', cat: CAT_KADIN, notes: 'Üst: Mandalin, Bergamot\nOrta: Gül, Şakayık, Iris\nAlt: Amber, Misk, Sandal', desc: 'Bağımsız ve güçlü kadınların parfümü.' },
      { name: 'PDM Delina La Rosee', cat: CAT_KADIN, notes: 'Üst: Limon, Bergamot\nOrta: Gül, Lychee\nAlt: Misk, Sandal, Amber', desc: 'Delina\'nın çiy damlası — taze, hafif ve uçucu hali.' },
      { name: 'PDM Cassili', cat: CAT_KADIN, notes: 'Üst: Şeftali, Bergamot\nOrta: Gül, Yasemin, Iris\nAlt: Misk, Sandal, Vanilya', desc: 'Beyaz misk gülün saf güzelliğine adanmış feminen koku.' },
      { name: 'PDM Meliora', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Iris, Gül, Sandal\nAlt: Amber, Misk, Deri', desc: 'Daha iyiye ulaşma arzusunu anlatan sofistike koku.' },
      { name: 'PDM Sedbury', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Greyfurt\nOrta: Lavanta, Sedir\nAlt: Amber, Vetiver, Misk', desc: 'İngiliz kırsalının maskülen taze havasını anlatan koku.' },
      { name: 'PDM Carlisle', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Karabiber\nOrta: Gül, Sandal\nAlt: Amber, Misk, Deri', desc: 'İngiliz şehrinin zarafetini ve tarihini anlatan erkek parfümü.' },
      { name: 'PDM Herod', cat: CAT_ERKEK, notes: 'Üst: Tütün, Bergamot\nOrta: Vanilya, Amber\nAlt: Sandal, Misk, Deri', desc: 'Kral Herodes\'un gücünü ve ihtişamını taşıyan erkek parfümü.' },
      { name: 'PDM Perseus', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Greyfurt\nOrta: Sandal, Gül\nAlt: Amber, Misk, Vetiver', desc: 'Yunan mitolojisinin kahramanı Perseus\'a adanmış koku.' },
      { name: 'PDM Oajan', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Karabiber\nOrta: Oud, Gül\nAlt: Amber, Sandal, Misk', desc: 'At yarışı tutkunlarına adanmış hızlı ve güçlü erkek kokusu.' },
      { name: 'PDM Sedley', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Mandalin\nOrta: Sandal, Lavanta\nAlt: Misk, Amber, Vetiver', desc: 'İngiliz aristokrasisinin zarafetiyle donanmış erkek parfümü.' },
    ];
    for (const p of pdmProducts) await a({ name: p.name, brandId: pdm.id, categoryId: p.cat, price: 5000, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ KILIAN (eksik) ─────────────────────────────────────────────────────────
  const kilian = await getBrand('Kilian');
  if (kilian) {
    const kilianProducts = [
      { name: 'Kilian Black Phantom', cat: CAT_UNISEX, notes: 'Üst: Rom, Limon\nOrta: Gül, Kahve\nAlt: Vanilya, Karamel, Sandal', desc: 'Şekerin karanlık baştan çıkarıcılığını anlatan büyülü koku.' },
      { name: 'Kilian Good Girl Gone Bad', cat: CAT_KADIN, notes: 'Üst: Bergamot, Greyfurt\nOrta: Tuberöz, Gül, Yasemin\nAlt: Misk, Sandal', desc: 'İyi kız kötü olunca — tuberöz çiçeğin baştan çıkarıcı gücü.' },
      { name: 'Kilian Blue Moon Ginger Dash', cat: CAT_UNISEX, notes: 'Üst: Limon, Zencefil\nOrta: Iris, Gül\nAlt: Sandal, Misk, Amber', desc: 'Mavi ay ve zencefil dürbünüyle bakılan mistik bir koku.' },
      { name: 'Kilian Apple Brandy', cat: CAT_UNISEX, notes: 'Üst: Elma, Bergamot\nOrta: Gül, Iris\nAlt: Sandal, Vanilya, Misk', desc: 'Elma brandisinin sıcaklığını ve tatlılığını anlatan koku.' },
      { name: 'Kilian Back to Black', cat: CAT_UNISEX, notes: 'Üst: Tütün, Bergamot\nOrta: Gül, Yasemin\nAlt: Sandal, Amber, Misk', desc: 'Amy Winehouse\'un ikonik şarkısından ilham alan karanlık koku.' },
      { name: 'Kilian Forbidden Games', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Sümbül\nAlt: Sandal, Misk, Vanilya', desc: 'Yasak oyunların heyecanını ve cazibesini anlatan feminen koku.' },
      { name: 'Kilian Good Girl Gone Bad Extreme', cat: CAT_KADIN, notes: 'Üst: Bergamot, Greyfurt\nOrta: Tuberöz, Gül, Yasemin\nAlt: Misk, Sandal, Amber', desc: 'İyi kızın en aşırı versiyonu — daha yoğun, daha cesur.' },
      { name: 'Kilian Intoxicated', cat: CAT_UNISEX, notes: 'Üst: Kahve, Bergamot\nOrta: Kardamom, Musk\nAlt: Sandal, Misk, Vanilya', desc: 'Kahvenin sarhoş edici büyüsüne kapılan bir koku deneyimi.' },
      { name: 'Kilian Moonlight in Heaven', cat: CAT_UNISEX, notes: 'Üst: Greyfurt, Bergamot\nOrta: Hindistan cevizi, Çarkıfelek çiçeği\nAlt: Sandal, Misk', desc: 'Cennetin ay ışığında huzur ve özgürlük kokusu.' },
      { name: 'Kilian Vodka on the Rocks', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Buz notaları\nOrta: Gül, Iris\nAlt: Sandal, Misk, Buz', desc: 'Buzlu votkanın serinliği ve ferahlığını anlatan koku.' },
      { name: 'Kilian Straight to Heaven', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Karabiber\nOrta: Tütün, Amber\nAlt: Sandal, Deri, Misk', desc: 'Rum ve erkek gücünü doğrudan cennete taşıyan koku.' },
      { name: 'Kilian Woman in Gold', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Amber, Sandal, Misk', desc: 'Altın kadının ihtişamı ve gücünü yansıtan feminen koku.' },
      { name: 'Kilian Rolling in Love', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris, Yasemin\nAlt: Sandal, Misk, Vanilya', desc: 'Aşkın içinde yuvarlanmanın mutluluğunu anlatan koku.' },
      { name: 'Kilian Smoking Hot', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Gül, Deri\nAlt: Amber, Sandal, Misk', desc: 'Duman gibi sıcak, çekici ve unutulmaz bir koku.' },
      { name: 'Kilian Angels Share', cat: CAT_UNISEX, notes: 'Üst: Konyak, Vanilya\nOrta: Tarçın, Meşe\nAlt: Amber, Sandal, Misk', desc: 'Viskinin fıçıda buhara dönüşen "meleklerin payı" na adanmış koku.' },
    ];
    for (const p of kilianProducts) await a({ name: p.name, brandId: kilian.id, categoryId: p.cat, price: 5500, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ AMOUAGE (eksik) ────────────────────────────────────────────────────────
  const amouage = await getBrand('Amouage');
  if (amouage) {
    const amouageProducts = [
      { name: 'Amouage Memoir Man', cat: CAT_ERKEK, notes: 'Üst: Absinthe, Bergamot\nOrta: Gül, Sandal\nAlt: Amber, Oud, Misk', desc: 'Erkek hafızasının karanlık köşelerini keşfeden güçlü koku.' },
      { name: 'Amouage Memoir Woman', cat: CAT_KADIN, notes: 'Üst: Absinthe, Bergamot\nOrta: Gül, Tuberöz\nAlt: Amber, Sandal, Misk', desc: 'Kadın hafızasının derinliklerinde saklı anılar.' },
      { name: 'Amouage Blossom Love', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Liç\nAlt: Sandal, Misk, Vanilya', desc: 'Çiçek aşkının en saf ve neşeli ifadesi.' },
      { name: 'Amouage Honour 43', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Iris, Sandal, Gül\nAlt: Amber, Misk, Oud', desc: 'Onurun 43. yılını kutlayan özel koleksiyon parfümü.' },
    ];
    for (const p of amouageProducts) await a({ name: p.name, brandId: amouage.id, categoryId: p.cat, price: 5000, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ ARMANI PRIVE (eksik) ───────────────────────────────────────────────────
  const armprive = await getBrand('Armani Privé');
  if (armprive) {
    const armPriveProducts = [
      { name: 'Armani Prive Jasmin Kusamono', cat: CAT_KADIN, notes: 'Üst: Bergamot, Yeşil yapraklar\nOrta: Yasemin, Lotus\nAlt: Sandal, Misk, Amber', desc: 'Japon bahçe sanatı kusamono\'dan ilham alan çiçeksi koku.' },
      { name: 'Armani Prive Magenta Tanzanite', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris, Sümbül\nAlt: Sandal, Misk, Amber', desc: 'Tanzanite mücevherinin mor büyüsünü taşıyan feminen koku.' },
      { name: 'Armani Prive Noir Kogane', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Güneş çiçeği, Sandal\nAlt: Oud, Amber, Deri', desc: 'Altın ve siyahın dramatik kontrastını yaşatan Japon ilhamlı koku.' },
      { name: 'Armani Prive Rose D\'Arabie', cat: CAT_KADIN, notes: 'Üst: Gül, Bergamot\nOrta: Arap gülü, Sandal\nAlt: Misk, Amber, Oud', desc: 'Arap güllerinin kraliçesiyle Akdeniz zarafetinin buluşması.' },
      { name: 'Armani Prive Oud Royal', cat: CAT_UNISEX, notes: 'Üst: Safran, Bergamot\nOrta: Oud, Gül\nAlt: Amber, Deri, Sandal', desc: 'Kraliyet oudunun görkemini taşıyan lüks unisex koku.' },
      { name: 'Armani Prive Rose Milano', cat: CAT_KADIN, notes: 'Üst: Bergamot, Gül yaprakları\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Milano\'nun zarif güllerini anlatan şehir çiçeği parfümü.' },
      { name: 'Armani Prive Bleu Lazuli', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Portakal\nOrta: Iris, Gül\nAlt: Sandal, Misk, Amber', desc: 'Lacivert lacivert lapislazuli taşının derinliğini anlatan koku.' },
      { name: 'Armani Prive Blue Turquoise', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Turunç\nOrta: Iris, Lavanta\nAlt: Sandal, Misk, Amber', desc: 'Turkuaz mavinin ferahlığı ve serinliğini anlatan koku.' },
      { name: 'Armani Prive Blanc Kogane', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Tuberöz, Gül\nAlt: Sandal, Misk, Amber', desc: 'Altın beyaz — saf ve zarif Japon stilinde koku.' },
      { name: 'Armani Prive Cuir Noir', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Deri, Gül\nAlt: Oud, Amber, Misk', desc: 'Siyah deri — güç ve sır dolu, sofistike bir deri parfümü.' },
      { name: 'Armani Prive Gardenia Antigua', cat: CAT_KADIN, notes: 'Üst: Bergamot, Greyfurt\nOrta: Gardenia, Tuberöz\nAlt: Sandal, Misk, Amber', desc: 'Antigua adasının antik gardenya bahçelerinden ilham.' },
      { name: 'Armani Prive Indigo Tanzanite', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Iris, Lavanta\nAlt: Sandal, Misk, Amber', desc: 'İndigo ve tanzanite mücevherinin büyülü mavi dünyası.' },
    ];
    for (const p of armPriveProducts) await a({ name: p.name, brandId: armprive.id, categoryId: p.cat, price: 4800, desc: p.desc, notes: p.notes, ozel: true });
  }

  // ─ INITIO (eksik) ─────────────────────────────────────────────────────────
  const initio = await getBrand('Initio');
  if (initio) {
    await a({ name: 'Initio Oud for Happiness', brandId: initio.id, categoryId: CAT_UNISEX, price: 5000, desc: 'Oud\'un mükemmeliyetinde mutluluğun özünü arayan ilahi koku.', notes: 'Üst: Safran, Bergamot\nOrta: Oud, Gül, Sandal\nAlt: Amber, Misk, Deri', ozel: true });
    await a({ name: 'Initio Paragon', brandId: initio.id, categoryId: CAT_UNISEX, price: 5000, desc: 'Mükemmellik standardını belirleyen, karşılaştırma noktası parfüm.', notes: 'Üst: Bergamot, Iris\nOrta: Iris, Sandal\nAlt: Amber, Misk', ozel: true });
    await a({ name: 'Initio Regab', brandId: initio.id, categoryId: CAT_UNISEX, price: 5000, desc: 'Suyun enerjisi ve özgürlüğünü anlatan marine koku.', notes: 'Üst: Marine notalar, Bergamot\nOrta: Iris, Amber\nAlt: Sandal, Misk', ozel: true });
  }

  // ─ MONTALE (eksik — çok ürün) ─────────────────────────────────────────────
  const montale = await getBrand('Montale');
  if (montale) {
    const montaleProducts = [
      { name: 'Montale Amber Spices', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Karabiber\nOrta: Amber, Kalabalık\nAlt: Misk, Sandal, Vanilya', desc: 'Amber ve baharatların harmonisini yaşatan sıcak koku.' },
      { name: 'Montale Aoud Tabacco', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Tütün\nOrta: Oud, Gül\nAlt: Amber, Deri, Misk', desc: 'Oud ve tütünün derin birlikteliğini anlatan doğulu koku.' },
      { name: 'Montale Aoud Forest', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Oud, Sedir\nAlt: Amber, Deri, Misk', desc: 'Oud ormanının gizemini ve vahşetini yansıtan koku.' },
      { name: 'Montale Arabians', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Oud\nAlt: Amber, Sandal, Misk', desc: 'Arap çöllerinin zenginliğini anlatan lüks koleksiyon kokusu.' },
      { name: 'Montale Aoud Night', cat: CAT_UNISEX, notes: 'Üst: Safran, Bergamot\nOrta: Oud, Gül, Sandal\nAlt: Amber, Deri, Misk', desc: 'Gece oudunun derinliğini ve gizemini yaşatan koku.' },
      { name: 'Montale Black Aoud', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Safran\nOrta: Siyah oud, Gül\nAlt: Amber, Deri, Misk', desc: 'Siyah oudun erkeksi ve güçlü tarafını sergileyen klasik.' },
      { name: 'Montale Chocolate Grey', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Kakao\nOrta: Gül, Amber\nAlt: Sandal, Misk, Vanilya', desc: 'Çikolatanın sıcaklığını gri amber tonlarıyla harmanlayan koku.' },
      { name: 'Montale Black Musk', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Bergamot\nOrta: Misk, Sandal\nAlt: Siyah misk, Amber', desc: 'Siyah miskin yoğun ve derin güzelliğini öne çıkaran koku.' },
      { name: 'Montale Crystal Flowers', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Zambak, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Kristal çiçeklerin saf ve berrak güzelliği.' },
      { name: 'Montale Candy Rose', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Yasemin\nAlt: Sandal, Vanilya, Misk', desc: 'Şeker gülü kadar tatlı ve baştan çıkarıcı feminen koku.' },
      { name: 'Montale Dark Purple', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Mor\'un karanlık zenginliğini taşıyan zarif kadın parfümü.' },
      { name: 'Montale Dark Vanilla', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Vanilya\nOrta: Gül, Amber\nAlt: Sandal, Misk, Vanilya', desc: 'Karanlık vanilyayı gün yüzüne çıkaran sıcak koku.' },
      { name: 'Montale Day Dreams', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Yasemin\nAlt: Sandal, Misk, Amber', desc: 'Gündüz hayallerinin pembe ve soft dünyasına açılan kapı.' },
      { name: 'Montale Intense Cherry', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Kiraz\nOrta: Gül, Tuberöz\nAlt: Sandal, Amber, Misk', desc: 'Kirazın yoğun ve çekici kokusuyla büyüleyen sofistike parfüm.' },
      { name: 'Montale Diamond Rose', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Iris\nAlt: Sandal, Misk, Amber', desc: 'Elmas ve gülün birleşimi gibi değerli ve parlak bir koku.' },
      { name: 'Montale Intense Pepper', cat: CAT_ERKEK, notes: 'Üst: Bergamot, Karabiber\nOrta: Sandal, Gül\nAlt: Amber, Deri, Misk', desc: 'Biberin yoğun baharatını öne çıkaran cesur erkek kokusu.' },
      { name: 'Montale Intense Roses Musk', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Misk\nAlt: Sandal, Amber', desc: 'Güllerin yoğun kokusuyla miskin sıcaklığının buluşması.' },
      { name: 'Montale Moon Aoud', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Oud, Gül\nAlt: Amber, Sandal, Misk', desc: 'Ay ışığında parıldayan oud — romantik ve mistik.' },
      { name: 'Montale Pure Gold', cat: CAT_KADIN, notes: 'Üst: Bergamot, Mandalin\nOrta: Gül, Iris\nAlt: Sandal, Altın amber, Misk', desc: 'Saf altın değerindeki bu parfüm, mutlak lüksü simgeler.' },
      { name: 'Montale Rose Musk', cat: CAT_KADIN, notes: 'Üst: Bergamot, Gül\nOrta: Gül, Misk\nAlt: Sandal, Amber', desc: 'Gül ve miskin saf ve güçlü birlikteliği.' },
      { name: 'Montale Rose Night', cat: CAT_KADIN, notes: 'Üst: Bergamot, Gece çiçeği\nOrta: Gül, Yasemin\nAlt: Sandal, Amber, Misk', desc: 'Gece güllerin en güzel haliyle açtığı büyülü an.' },
      { name: 'Montale Rose Elixir', cat: CAT_KADIN, notes: 'Üst: Bergamot, Şeftali\nOrta: Gül, Tuberöz\nAlt: Sandal, Misk, Amber', desc: 'Gülün tüm özünü tek damla iksirde toplayan koku.' },
      { name: 'Montale Sensual Instinct', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Safran\nOrta: Gül, Amber\nAlt: Sandal, Misk, Deri', desc: 'Duyusal içgüdüleri uyandıran, akılda kalan baştan çıkarıcı koku.' },
      { name: 'Montale Starry Nights', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Limon\nOrta: Iris, Gül\nAlt: Sandal, Amber, Misk', desc: 'Van Gogh\'un yıldızlı gecesini parfüme dönüştüren koku.' },
      { name: 'Montale So Amber', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Amber, Gül\nAlt: Sandal, Misk, Vanilya', desc: 'Amberin saf ve sıcak büyüsünü anlatan güzel koku.' },
      { name: 'Montale Vanilla Cake', cat: CAT_UNISEX, notes: 'Üst: Bergamot, Mandalin\nOrta: Vanilya, Gül\nAlt: Sandal, Misk, Şeker', desc: 'Vanilyalı pastanın tatlı ve sıcak kokusu.' },
      { name: 'Montale White Musk', cat: CAT_UNISEX, notes: 'Üst: Bergamot\nOrta: Beyaz misk, Gül\nAlt: Sandal, Amber', desc: 'Beyaz miskin temiz ve ferah güzelliğini öne çıkaran koku.' },
    ];
    for (const p of montaleProducts) await a({ name: p.name, brandId: montale.id, categoryId: p.cat, price: 3500, desc: p.desc, notes: p.notes, ozel: true });
  }

  console.log('\n✅ PART 2 TAMAMLANDI');
  console.log(`Eklenen: ${added.length}`);
  console.log(added.join('\n'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
