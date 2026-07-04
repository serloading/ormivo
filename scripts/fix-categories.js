const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const KADIN  = '157a83bd-ac0e-4209-afbe-4a6b521c0d1c';
const ERKEK  = '1396bc28-5544-4b6e-b002-b7dbd2dc4569';
const UNISEX = '43814ff0-f64a-48cc-be2e-07fde204bce6';

// NO CATEGORY → KADIN
const toKadin = [
  'cmqztl70q000glstykkyy1vk2', // Guerlain Allegoria Floracherrysia
  'cmqztl7gs000hlsty4jnyfwhr', // Guerlain Allegoria Herba Fresca
  'cmqztl999000llsty0yplzor7', // Guerlain Allegoria Nerolia Vetiver
  'cmqztl8t5000klsty85firra1', // Guerlain Aqua Allegoria Flora Salvaggía
  'cmqztl7ww000ilsty9w9139sy', // Guerlain Aqua Allegoria Florarosa
  'cmqztl6ko000flstyrff94j76', // Guerlain Aqua Allegoria Mandarine
  'cmqztl8d0000jlsty510s4b6s', // Guerlain Aqua Allegoria Passiflora
  'cmqztmmvg003llstyqjgca28o', // Lancome Bella Rose Extraordinaire
  'cmqztldap000ulstyub1bvooa', // Valentino BORN IN ROMA Extra DOSE W
  'cmqztln52001glstymyji0m6a', // CH Good Girl Classic
  'cmqztlnl7001hlsty0wwjw5cn', // CH Good Girl Dazzling Garden
  'cmqztlmox001flstyoh94e4gt', // CH Good Girl Dot Drama
  'cmqztlpdr001llstyok1d87tx', // CH Good Girl EDP
  'cmqztllsk001dlstye5mcb2xk', // CH Good Girl Gold Fantasy
  'cmqztlm8n001elstyd9jz4k9s', // CH Good Girl Supreme
  'cmqztlohc001jlsty5fjvj207', // CH Good Girl Swarowski Limited Edition
  'cmqztlkwg001blstyjkk689iw', // CH Good Girl Velvet Fatale
  'cmqztlo19001ilstyiss1226i', // CH Good Girl Very
  'cmqztllci001clstyxm8qv7wm', // CH Good Girl Very Glam
  'cmqztloxj001klsty0ffqub08', // CH Good Girl White
  'cmqztlptv001mlstygq5zo2mi', // CH Good Girl Sparling Ice
  'cmqztls2o001rlsty7ncq07u5', // Chanel Chance EDT
  'cmqztlsyv001tlsty5yj90vdc', // Chanel Chance Fresh
  'cmqztlub7001wlstyun0ckylt', // Chanel Chance Mademoiselle
  'cmqztlsit001slstyptzdumxg', // Chanel Chance Parfum
  'cmqztltv2001vlsty986w9hrm', // Chanel Coco Mademoiselle L Prive
  'cmqztltey001ulsty0snnbi99', // Chanel Coco Parfum
  'cmqztlurc001xlstyrp9kks0k', // Chanel N5 L eau
  'cmqztli7x0015lsty27q44o1i', // CK CKin2U Heat CB Women
  'cmqztlhrv0014lstytdd2auix', // CK CKin2U Heat EDT Women
  'cmqztljk70018lsty66t8y75i', // CK CKin2U Heat NF Women
  'cmqztlio00016lstyjpz1gj25', // CK CKin2U Heat Women EDP
  'cmqztlgfp0011lsty2788qapi', // CK Eternity For Women Aromatic Essence
  'cmqztlhbt0013lstyyqzbclpt', // CK Eternity For Women Intense
  'cmqztlw3i0020lstylc1nxl16', // Creed Carmina
  'cmqztlxw00024lstyp968wpmd', // Creed Fleurs De Gardenia
  'cmqztlvnf001zlstybvlc9dx9', // Creed Wing Flowers Woman
  'cmqztm77s002mlstynekvw7rb', // D&G L Imperatrice Limited Edition
  'cmqztm6rp002llstys0b1yi56', // D&G L Imperatrice No5
  'cmqztm8kb002plstyqg4bcg8a', // D&G Light Blue Forever W
  'cmqztm9gj002rlstybl9l15tv', // D&G Light Blue Intense W
  'cmqztm6bm002klstyo61odai7', // D&G My Devotion Intense
  'cmqztm7nz002nlstyhn15ak3g', // D&G Queen Intense
  'cmqztm846002olstyxtfkjj9m', // D&G Queen Intense EDP W
  'cmqztlcdx000slstyyfu1pqth', // Marc Jacobs Daisy EAU So Fresh Spring
  'cmqztm37n002elstyxbr92u77', // Dior Dune Eau Parfum
  'cmqztm458002glsty9ury2tzt', // Dior Hypnotic Poison EDT
  'cmqztm1c1002alstytkfw9t6b', // Dior J adore Black EDP
  'cmqztm1t3002blsty15si1jd6', // Dior J adore Gold Supreme
  'cmqztm2ab002clstybn3g93yb', // Dior J adore Shampoo
  'cmqztm3of002flstyp0l2qz6z', // Dior J adore Special EDP
  'cmqztm5vj002jlstyfpx5ygkv', // Dior Joy Intense EDP
  'cmqztm4li002hlstypoj4muq7', // Dior Poison Girl EDT
  'cmqztm5fh002ilsty5k891jwm', // Dior Pure Poison EDT
  'cmqztmets0033lstyrzi0m5zo', // Givenchy Ange Ou Demon Elixir
  'cmqztmedq0032lsty4wk8hbrc', // Givenchy Ange Ou Le Secret
  'cmqztl3g20008lstyap18hu59', // Gucci Flora Emerald Gardenia
  'cmqztl2zz0007lstyvr2rm78w', // Gucci Flora Glamorous Magnolia
  'cmqztl17h0003lsty5b2lm0yw', // Gucci By Gucci EDP
  'cmqztl2jq0006lsty1yl3lxtc', // Gucci Guilty Pour Femme
  'cmqztl23o0005lstyr1gj2xqj', // Gucci Guilty Pour Femme Absolute
  'cmqztl1nl0004lstylwvb4763', // Gucci Rush 2 EDT
  'cmqztl4se000blstyecd987h9', // Guerlain Champs Elysees
  'cmqztl58i000clstyvuprfvcl', // Guerlain Idyyle EDP
  'cmqztl3w60009lsty3tui10nj', // Guerlain Jasmin Bonheur
  'cmqztl5oj000dlsty9es1qi5y', // Guerlain La Petite Robe Noire EDT
  'cmqztl64l000elstyfgo4x0m4', // Guerlain La Petite Robe Noire Intense
  'cmqztmg5y0036lsty3iqoracg', // Kilian Love The Way You Taste
  'cmqztmnbi003mlstyo1ouvas3', // Lancome La Nuit Tresor Intense EDP
  'cmqztmjal003dlstyp9zdbgmg', // Lancome La Vie Est Belle D Exception
  'cmqztmlj6003ilstyzwbxhc5a', // Lancome La Vie Est Belle Intense
  'cmqztmmfc003klstyuds0arsq', // Lancome La Vie Est Belle Intensement
  'cmqztmk6v003flstygpxmg7jj', // Lancome La Vie Est Belle L Eclat
  'cmqztmkn0003glstyxv58oeg1', // Lancome La Vie Est Belle L Elixir
  'cmqztmjqr003elsty3lthvpzf', // Lancome La Vie Est Belle L Eveil
  'cmqztml34003hlstynb8a39vu', // Lancome La Vie Est Belle Richard
  'cmqztmlz9003jlstygeeqpk4h', // Lancome La Vie Est Belle Soleil Crystal
  'cmqztmq05003slstyeyzfljlo', // Lancome La Vie Est Belle Vanille Nude
  'cmqztmnrk003nlsty9570s93p', // Lancome Hypnose EDT
  'cmqztmo7m003olstyl3kx6ash', // Lancome Hypnose EDTP
  'cmqztmhyc003alstyf0nwvl99', // Lancome Idole Aura
  'cmqztmhi90039lstykkpl9c83', // Lancome Idole Le Grand
  'cmqztmief003blstyxb1o6x0z', // Lancome Idole Le Limitee
  'cmqztmh260038lstyylzqam4v', // Lancome Idole Le Parfum
  'cmqztmiui003clstyqc9alilk', // Lancome Miracle EDP
  'cmqztmons003plstyoxrxnvcq', // Lancome Tresor Intense EDP
  'cmqztmgm10037lstyy9ngukhx', // Narciso Rodriguez For Her Limited
  'cmqztlbhn000qlstyq97ww1ft', // Paco Rabanne Olympea Parfum
  'cmqztlbxr000rlstyd45a8yqg', // Paco Rabanne Ultra Violet W
  'cmqztmpjz003rlstyr00hthtj', // Lancome Tresor Midnight Rose
  'cmqztmp3w003qlsty5zi6j5vs', // Lancome Tresor Midnight Rose Elixir
  'cmqztle6x000wlstyh36oonh4', // Victoria Secret Paris EDP
  'cmqztlen6000xlstygf5jk5ye', // Victoria Secret Sexy Orchid
  'cmqztlfji000zlstypwbmw1uf', // Zara Wonder ROSE
];

// NO CATEGORY → ERKEK
const toErkek = [
  'cmqztlkge001alstyn52hp5nx', // CH 212 VIP Men
  'cmqztlv7e001ylstyglcgwv8y', // Chanel Allure Homme Sport
  'cmqztlrml001qlsty0d2bylo8', // Chanel Bleu De Chanel EDT
  'cmqztlj430017lstyb5venohk', // CK CKin2U Heat Men
  'cmqztlk0b0019lsty805vuw68', // CK CKin2U Pop Men
  'cmqztlfzl0010lstymdvxvkvv', // CK Eternity For Men Aromatic Essence
  'cmqztlgvr0012lstyxwjscr7h', // CK Eternity For Men EDP
  'cmqztlyc30025lstybwqetu0t', // Creed Bois Du Portugal
  'cmqztlwzx0022lstykmzk4aiz', // Creed Millesime Imperial
  'cmqztlwjn0021lstyn98qebu8', // Creed Vetiver Geranium
  'cmqztlxfz0023lstyq6720twy', // Creed Viking
  'cmqztmat2002ulstyb72z9bnh', // D&G Intenso EDP
  'cmqztm90e002qlsty3tu7z12a', // D&G Light Blue Forever M
  'cmqztm9ww002slsty1ttpo58v', // D&G Light Blue Intense M
  'cmqztmacz002tlstyc9030ja5', // D&G Light Blue Summer Vibes M
  'cmqztlys50026lstygocwbhge', // Dior Homme EDP
  'cmqztlz890027lstyfkkrsqo9', // Dior Homme Sport
  'cmqztm0vu0029lsty5y9x34xc', // Dior Sauvage Eau Forte
  'cmqztm2qn002dlsty9gvdlwo9', // Dior Sauvage Rouge Vita
  'cmqztlzob0028lstyf4vfhxgp', // Dior Sauvage Sport EDP
  'cmqztmf9u0034lsty80dp985m', // Givenchy Blue Label
  'cmqztla5g000nlstyjae8afxn', // Paco Rabanne One Million Elixir
  'cmqztlali000olsty6f5i7zy5', // Paco Rabanne One Million Gold OUD
  'cmqztlb1l000plstyjkvism97', // Paco Rabanne One Million Pacman
  'cmqztl9pe000mlstyswmo6eh4', // Paco Rabanne One Million The New
  'cmqztlcum000tlstyoxlpysst', // Prada L Homme Parfum
  'cmqztldqs000vlsty5o2hjm3d', // Valentino Ivory M
  'cmqztlf39000ylsty8d92ehx5', // Viktor Rolf Spicebomb Infrared
  'cmqztl0re0002lsty3qofq5sx', // Armani YOU Freeze M
];

// NO CATEGORY → UNISEX
const toUnisex = [
  'cmqztlr6f001plstyg2rk6fw0', // Celine Parade
  'cmqztlqqb001olsty54m6kesu', // Celine Reptile
  'cmqztlqa8001nlstyd28c90cr', // Celine Zouzou
  'cmqztmb94002vlstycbidq2b8', // Ducci Giardini Bianco Latte
  'cmqztmc5c002xlstyac5a3but', // Ducci Giardini Bianco Oro
  'cmqztmbp9002wlstyzriue175', // Ducci Giardini Borabora
  'cmqztmclg002ylsty1apxyz1b', // Ducci Giardini Christos
  'cmqztmdxn0031lstye8r2xmsg', // Ducci Giardini Colona Noble
  'cmqztmdhk0030lstyfn0xo4cs', // Ducci Giardini Rosso Radice
  'cmqztmd1i002zlstyp76wk98m', // Ducci Giardini Rosso Rubino
  'cmqztl4cb000alstyjbbda7kd', // Guerlain Champ Epices
  'cmqztmfpw0035lstyzwvnvjdx', // Kilian Angel Share Paradis
];

async function main() {
  const r1 = await prisma.product.updateMany({ where: { id: { in: toKadin } }, data: { categoryId: KADIN } });
  console.log('KADIN guncellendi:', r1.count);
  const r2 = await prisma.product.updateMany({ where: { id: { in: toErkek } }, data: { categoryId: ERKEK } });
  console.log('ERKEK guncellendi:', r2.count);
  const r3 = await prisma.product.updateMany({ where: { id: { in: toUnisex } }, data: { categoryId: UNISEX } });
  console.log('UNISEX guncellendi:', r3.count);

  // Kalan kategorisiz kontrol
  const remaining = await prisma.product.count({ where: { categoryId: null, deletedAt: null } });
  console.log('Hala kategorisiz:', remaining);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
