import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB = 'postgresql://postgres.ifwynasdiljzxpqjvxrb:kUh%3FY%2AZSUC_6G_K@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const adapter = new PrismaPg({ connectionString: DB });
const prisma = new PrismaClient({ adapter });

// id -> scentNotes
const SCENTS: Record<string, string> = {
  // ── AMOUAGE ──
  'cmqqzvhfn00021gty1k0ifsj7': 'Bergamot, Cardamom, Iris, Orris, Cedarwood, Vetiver',
  'cmqqzvi1700041gtygzg7h3r1': 'Neroli, Jasmine, Rose, Oud, Amber, Sandalwood',
  'cmqqzvhtd00031gty7uvcv2j4': 'Pink Pepper, Saffron, Iris, Patchouli, Civet, Musk',
  'cmqqzvi9000051gtyuuqclzge': 'Mandarin, Frankincense, Rose, Oud, Leather, Civet',
  'cmqqzvih900061gtyzyn2t0gq': 'Bulgarian Rose, Jasmine, Ylang Ylang, Myrrh, Sandalwood, Musk',
  'cmqqzvip800071gtykjcmjx4p': 'Oregano, Labdanum, Oud, Black Pepper, Amber, Tobacco',
  'cmqqzvix700081gty9hx37pwn': 'Peach, Rose, Jasmine, Musk, Vanilla, Sandalwood',
  'cmqqzvj5d00091gtyfl0bs1yc': 'Rose, Iris, Aldehydes, Sandalwood, Musk, White Amber',
  'cmqqzvjdi000a1gtygcnw6tnn': 'Green Notes, Petrichor, Oud, Vetiver, Leather, Moss',
  'cmqqzvjlg000b1gty2zlfuocb': 'Neroli, Bergamot, White Musk, Cedar, Amber, Vetiver',
  'cmqqzvjtg000c1gtyvaai1rlf': 'White Rose, Jasmine, Heliotrope, Musk, Sandalwood, Amber',

  // ── ANFAR ──
  'cmqqzvk1d000d1gtyogs93321': 'Pistachio, Vanilla, Tonka Bean, Sandalwood, Musk, Caramel',

  // ── ARMANI ──
  'cmqqzvk9b000e1gtyl0mpv92j': 'Cardamom, Lavender, Vanilla, Cedarwood, Amber, Musk',
  'cmqqzvkh9000f1gty48fc27q6': 'Chestnut, Cardamom, Lavender, Vanilla, Patchouli, Amber',
  'cmqqzvkph000g1gtyxt8g1wpg': 'Cashmere, Vanilla, Cedarwood, Lavender, Tonka Bean, Sandalwood',
  'cmqqzvkxx000h1gtyh7x7puu5': 'Marine Notes, Bergamot, Neroli, Rosemary, Cedarwood, Musk',
  'cmqqzvl83000i1gtyq6lmqgxd': 'Bergamot, Marine Notes, Incense, Geranium, Patchouli, Guaiac Wood',
  'cmqqzvlje000j1gtylpu9zpoj': 'Pink Lemonade, Bergamot, Iris, Peony, Musk, Vanilla',
  'cmqqzvlt5000k1gtyrjvy2s2a': 'Bergamot, Orange Blossom, Honey, Tonka Bean, Vanilla, Sandalwood',
  'cmqqzvm1h000l1gtynxmk2itw': 'Cashmere Wood, Vanilla, Tonka Bean, Sandalwood, White Musk, Amber',
  'cmqqzvm9q000m1gtybtf3usaa': 'Bergamot, Green Notes, Lemon, Lavender, Tonka Bean, Cedar',
  'cmqqzvmi3000n1gtyq7mmadn5': 'Bergamot, Cardamom, Black Pepper, Leather, Vanilla, Amber',
  'cmqqzvmq9000o1gty2ix0fyb1': 'Orange Blossom, Iris, Jasmine, Vanilla, Musk, White Cedar',
  'cmqqzvmyb000p1gtyfxytgvhv': 'Magnolia, Orange Blossom, Vetiver, White Musk, Cashmere Wood, Iris',
  'cmqqzvnmr000s1gtyw9d51xs9': 'Blackcurrant, Bergamot, Black Pepper, Patchouli, Vetiver, Amber',
  'cmqqzvnuw000t1gty3whybhty': 'Peony, Rose, Jasmine, White Musk, Cedarwood, Iris',
  'cmqqzvo32000u1gtyz02qggbk': 'Rose, Jasmine, Patchouli, Vanilla, Amber, Musk',
  'cmqqzvob6000v1gty6zvk873r': 'Bergamot, Chestnut, Vanilla, Lavender, Patchouli, Sandalwood',
  'cmqqzvojb000w1gtygco6zzvm': 'Cardamom, Tonka Bean, Amber, Cedarwood, Musk, Warm Spices',
  'cmqqzvorb000x1gtyt9vi3it4': 'Leather, Cardamom, Lavender, Suede, Cedarwood, Amber',
  'cmqqzvozi000y1gty901awjvm': 'Oud, Cedarwood, Cardamom, Amber, Leather, Musk',
  'cmqqzvp8b000z1gtyr4wxppbz': 'Sandalwood, Cardamom, Vanilla, Cedarwood, Tonka Bean, Musk',
  'cmqqzvpg700101gtynlkqu830': 'Tobacco, Cardamom, Vanilla, Cedarwood, Amber, Tonka Bean',
  'cmqqzwdjb003x1gty54q3ulmy': 'Bergamot, Jasmine, Patchouli, Incense, Labdanum, Amber',
  'cmqqzwdrf003y1gty7wnhdt0a': 'Tuberose, Orange Blossom, Magnolia, White Musk, Cashmere, Vanilla',
  'cmqqzwdzc003z1gtysft09mc7': 'Chypre, Rose, Freesia, Sandalwood, White Musk, Patchouli',

  // ── ARMANI PRIVÉ ──
  'cmqqzvn67000q1gtyp68lfuys': 'Rose, Geranium, Malachite, Amber, Sandalwood, Musk',
  'cmqqzvnec000r1gty5iefogr6': 'Bergamot, Vert, Malachite, Vetiver, Cedarwood, White Musk',

  // ── AZZARO ──
  'cmqqzvpo200111gty5duh7dtu': 'Lavender, Vetiver, Tobacco, Sandalwood, Amber, Cashmeran',
  'cmqqzvpw600121gty6uchyuim': 'Tonka Bean, Cardamom, Amber, Cedarwood, Sandalwood, Musk',
  'cmqqzvq4d00131gtyd23fi92j': 'Apple, Lavender, Cardamom, Vetiver, Musk, Amber',

  // ── BURBERRY ──
  'cmqqzvqko00151gty2ia7e8yv': 'Peach, Freesia, Rose, Sandalwood, Vanilla, Musk',
  'cmqqzvr0o00171gty9dzkg6i5': 'Caramelized Lavender, Praline, Vanilla, Sandalwood, Amber, Musk',
  'cmqqzvqsr00161gtyp0704i6z': 'Caramelized Lavender, Praline, Vanilla, Sandalwood, Amber, Musk',
  'cmqqzvr9300181gtyx3vawlon': 'Blackcurrant, Jasmine, Amber, Musk, Sandalwood, Vetiver',
  'cmqqzvrh600191gtykng9xjqi': 'Black Cherry, Jasmine, Iris, Tonka Bean, Benzoin, Musk',
  'cmqqzvrp1001a1gtynn3kk7pt': 'Bergamot, Cardamom, Sandalwood, Amber, Musk, Incense',
  'cmqqzvrx4001b1gtya2esjlx9': 'Bergamot, Cardamom, Violet Leaves, Vetiver, Amber, Musk',
  'cmqqzvs4z001c1gtyav798r53': 'Rose, Jasmine, Peony, Sandalwood, Patchouli, Musk',
  'cmqqzxhii008v1gtyijyikib2': 'Lychee, Peach, Bluebell, Jasmine, Rose, Sandalwood',
  'cmqqzxhqo008w1gty46lxodrd': 'Bergamot, Geranium, Gardenia, Sandalwood, Musk, Amber',

  // ── BVLGARI ──
  'cmqqzvsd7001d1gtymcvod4s0': 'Marine Notes, Bergamot, Neroli, Cedar, Musk, Amber',
  'cmqqzvsmk001e1gtyxy994c8m': 'Saffron, Amber, Incense, Sandalwood, Musk, Oud',
  'cmqqzvt4m001f1gtywbcoy57o': 'Pomegranate, Rose, Saffron, Amber, Oud, Sandalwood',
  'cmqqzvtdr001g1gtyc7tiaiya': 'Cardamom, Bergamot, Vetiver, Sandalwood, Musk, Amber',
  'cmqqzvtly001h1gtyvlx8egtg': 'Tobacco, Rum, Amber, Oud, Leather, Sandalwood',
  'cmqqzvtu1001i1gtyizzjsg04': 'Black Pepper, Amber, Musk, Sandalwood, Benzoin, Incense',
  'cmqqzvu25001j1gty9zwo2ito': 'Mineral Notes, Frozen Bergamot, White Musk, Sandalwood, Vetiver, Amber',
  'cmqqzvua5001k1gtydij2rtjb': 'Marine, Bergamot, Rain, Cypress, Sandalwood, Musk',
  'cmqqzvuhz001l1gtywmgl6dde': 'Petrichor, Guaiac Wood, Sandalwood, Vetiver, Amber, Musk',
  'cmqqzvupz001m1gty4dvfj98f': 'Black Pepper, Cardamom, Sandalwood, Vetiver, Cedarwood, Musk',
  'cmqqzvuy0001n1gtydpeob56o': 'Neroli, Bergamot, Orange Blossom, Sandalwood, Vetiver, White Musk',
  'cmqqzvv61001o1gtyfgc9fl83': 'Water Hyacinth, Cassis, Lily, Amethyst, Sandalwood, Musk',
  'cmqqzvve3001p1gtyovhfr5n8': 'Coral, Peony, Orange Blossom, Sandalwood, Musk, Ambergris',
  'cmqqzvvm1001q1gtyu6xdqyoo': 'Rose, Magnolia, Golden Osmanthus, Sandalwood, Amber, Musk',

  // ── BYREDO ──
  'cmqqzvvu1001r1gtyvsk5mgg9': 'Tagetes, African Violet, Clary Sage, Ambergris, Vetiver, Musk',
  'cmqqzvw2b001s1gtyjk5mnify': 'Immortelle, Rose, Papyrus, Amber, Musk, Sandalwood',
  'cmqqzvwap001t1gtydcq3958g': 'Cypress, Space, Iris, Rubber, Vetiver, Leather',

  // ── CALVIN KLEIN ──
  'cmqqzvwjd001u1gty1q0e752p': 'Bergamot, Sandalwood, Musk, Vanilla, Amber, Cedarwood',
  'cmqqzvwrt001v1gtyk6onc5zf': 'Black Pepper, Ginger, Amber, Patchouli, Musk, Sensual Musk',
  'cmqqzvx0v001w1gty3ha4kgpx': 'Persimmon, Lotus, Black Orchid, Amber, Musk, Sandalwood',
  'cmqqzvxds001x1gtye3zn46vm': 'Bergamot, Cardamom, Pineapple, Musk, Sandalwood, Amber',
  'cmqqzvxtn001z1gty7e5yunxg': 'White Musk, Rose, Jasmine, Iris, Sandalwood, Amber',
  'cmqqzvxls001y1gtyzuk9jx2v': 'Lychee, Lotus, Violet, Musk, Sandalwood, Amber',

  // ── CARNER BARCELONA ──
  'cmqqzvy1m00201gtypy58msua': 'Leather, Tobacco, Birch, Amber, Sandalwood, Oud',
  'cmqqzvy9h00211gtye8o397qt': 'Sea Salt, Citrus, White Florals, Amber, Musk, Sandalwood',
  'cmqqzvyhl00221gty6s8b1n8h': 'Ocean Breeze, Coconut, Jasmine, Sandalwood, Ambergris, Musk',
  'cmqqzvypm00231gtyhrmo580z': 'Peach, Neroli, Freesia, Sandalwood, Musk, Amber',
  'cmqqzvyxm00241gtyj5acqjdp': 'Spices, Rose, Oud, Amber, Patchouli, Musk',
  'cmqqzvz5k00251gtymvtgmg4n': 'Lemon, Salt, Sea Notes, Vetiver, Cedar, Musk',
  'cmqqzvzdd00261gtym8suqct6': 'Magnolia, Iris, Moonstone, Sandalwood, White Musk, Amber',
  'cmqqzvzlz00271gtyy3byf55q': 'Fresh Green Tea, Citrus, White Florals, Cedar, Musk, Amber',

  // ── CAROLINA HERRERA ──
  'cmqqzvgy400001gtyqe3wgctc': 'Apple, Bergamot, Ginger, Sandalwood, Amber, Musk',
  'cmqqzvh6t00011gty77afcj5y': 'Black Patchouli, Dark Rum, Black Vanilla, Musk, Amber, Incense',
  'cmqqzvztx00281gtyxhppt3kf': 'Bergamot, Apple, Musk, Sandalwood, Cedar, Amber',
  'cmqqzw02100291gty8a1s9di0': 'Rose, Peony, Lychee, Musk, Sandalwood, White Woods',
  'cmqqzw0an002a1gtyjh4s5jhd': 'Bergamot, Orchid, Musk, Vanilla, Sandalwood, Amber',
  'cmqqzw0j8002b1gty94qlpmxx': 'Grapefruit, Peppercorn, Leather, Cedarwood, Amber, Musk',
  'cmqqzw0r6002c1gty2n3z0smw': 'Black Cherry, Bergamot, Amber, Patchouli, Vetiver, Benzoin',
  'cmqqzw0yy002d1gtysmj47yfv': 'Pink Pepper, Jasmine, Rose, Vanilla, Sandalwood, Musk',
  'cmqqzw16z002e1gty4gmosqi7': 'Wild Berry, Tuberose, Iris, Amber, Sandalwood, Musk',
  'cmqqzw1ew002f1gtyr0wasax2': 'Tropical Fruits, Florals, Musk, Amber, Sandalwood, Vanilla',
  'cmqqzw1n7002g1gtydlhct55a': 'Bergamot, Apple, Juniper, Amber, Sandalwood, Leather',
  'cmqqzw1v4002h1gtyz8o01shd': 'Peach, Rose, Iris, Amber, Musk, Sandalwood',
  'cmqqzw231002i1gty8s33j9xe': 'Iris, Violet, Bergamot, Amber, Sandalwood, Musk',

  // ── CARTIER ──
  'cmqqzw2ax002j1gtyv4f7onuq': 'Cheetah Accord, Gardenia, Magnolia, Sandalwood, Musk, Amber',

  // ── CASAMORATI ──
  'cmqqzw2j7002k1gtykaw3j70t': 'Bergamot, Rose, Jasmine, Amber, Sandalwood, Musk',
  'cmqqzw2r9002l1gty6x3m5dqn': 'Peach, Vanilla, Sandalwood, White Flowers, Musk, Amber',
  'cmqqzw2zv002m1gtyh58ik5gd': 'Iris, Rose, Violet, Sandalwood, Amber, Musk',
  'cmqqzw380002n1gty4vnczfpz': 'Bergamot, Lemon, Iris, Amber, Cedarwood, Musk',
  'cmqqzw3fx002o1gtykduyzp0g': 'Dark Rum, Amber, Patchouli, Leather, Sandalwood, Musk',

  // ── CHANEL ──
  'cmqqzw3ns002p1gty11rfpyt3': 'Aldehydes, Bergamot, Neroli, Jasmine, Rose, Sandalwood',
  'cmqqzw3vn002q1gtytdniz1bu': 'Bergamot, Neroli, Jasmine, Vetiver, Sandalwood, Musk',
  'cmqqzw45m002r1gtyhnd8i4q4': 'Citrus, Labdanum, Geranium, Ginger, Sandalwood, Musk',
  'cmqqzw4ev002s1gtylpvkb29u': 'Grapefruit, Hyacinth, Jasmine, Iris, Amber, White Musk',
  'cmqqzw4mr002t1gtytvetw2u2': 'Pink Pepper, Hyacinth, Jasmine, Amber, Patchouli, Musk',
  'cmqqzw52r002v1gtykyz8ldgw': 'Bergamot, Mandarin, Rose, Jasmine, Patchouli, Amber',
  'cmqqzw4um002u1gtyzf1tug3d': 'Bergamot, Mandarin, Rose, Jasmine, Patchouli, Vanilla',
  'cmqqzw5aw002w1gtyhm80j71s': 'Vetiver, Cedarwood, Musk, Sandalwood, Amber, Incense',
  'cmqqzw5ix002x1gtyn3c7x4ig': 'Bergamot, Grapefruit, Dry Cedar, Vetiver, Amber, Sandalwood',
  'cmqqzw5qt002y1gtymmi8cu3c': 'Aldehydes, Bergamot, Jasmine, Rose, Sandalwood, Vetiver',

  // ── CHLOÉ ──
  'cmqqzw5z7002z1gtyub63bc3b': 'Peony, Freesia, Rose, Cedarwood, Amber, Musk',
  'cmqqzw67700301gtymm8t6zc0': 'Oak Moss, Magnolia, Sandalwood, Vetiver, White Musk, Amber',

  // ── CHRISTIAN DIOR ──
  'cmqqzw6f300311gtyb8qsq1i0': 'Grapefruit, Bergamot, Iris, Sandalwood, Grey Musk, Ambergris',

  // ── CLIVE CHRISTIAN ──
  'cmqqzw6n800321gtyizq5qpws': 'Bergamot, Jasmine, Heliotrope, Sandalwood, Musk, Amber',
  'cmqqzw6v300331gtykotq3tln': 'Bergamot, Orchid, Rose, Sandalwood, Amber, Musk',
  'cmqqzw72y00341gtylv0lgwax': 'Rose, Jasmine, Violet, Sandalwood, Amber, Civet',
  'cmqqzw7ay00351gtya6pc8tin': 'Bergamot, Rose, Jasmine, Amber, Sandalwood, Musk',

  // ── CREED ──
  'cmqqzw7iy00361gtytg5mnpt4': 'Bergamot, Blackcurrant, Apple, Jasmine, Musk, Ambergris',
  'cmqqzw7qw00371gtyug653x5b': 'Peach, Rose, Vanilla, Musk, Sandalwood, Ambergris',
  'cmqqzw7yv00381gty2tehvk0c': 'Vanilla, Jasmine, Sandalwood, Musk, Amber, Tonka Bean',
  'cmqqzw86u00391gtye2vaevzj': 'Bergamot, Blackcurrant, Mint, Sandalwood, Musk, Amber',

  // ── DIOR ──
  'cmqqzw8ey003a1gtyo1pf1fss': 'Bergamot, Violet, Blood Orange, Amber, Sandalwood, Vetiver',
  'cmqqzw8mt003b1gtyz925ahi2': 'Bergamot, Lavender, Tonka Bean, Cedar, Amber, Musk',
  'cmqqzw92t003d1gtybgb4z2ih': 'Iris, Lavender, Bergamot, Amber, Vetiver, Sandalwood',
  'cmqqzw8uv003c1gtybd16s0nt': 'Lavender, Iris, Amber, Vetiver, Sandalwood, Musk',
  'cmqqzw9au003e1gty778xuczn': 'Almond, Heliotrope, Vanilla, Plum, Peach, Sandalwood',
  'cmqqzw9ip003f1gtylg8o73ju': 'Bergamot, Rose Centifolia, Jasmine, Ylang Ylang, Sandalwood, Musk',
  'cmqqzw9qr003g1gty8flpbw4k': 'Amber, Cherry, Patchouli, Vetiver, Sandalwood, Musk',
  'cmqqzw9yn003h1gtyuq3y2wz6': 'Bergamot, Pepper, Lavender, Vetiver, Amber, Musk',
  'cmqqzwa6i003i1gtykuaifk1s': 'Bergamot, Cardamom, Cinnamon, Amber, Sandalwood, Vanilla',
  'cmqqzxemy008i1gtyw0yz4oyj': 'Peony, Rose, Magnolia, Lily, Sandalwood, Musk',

  // ── DKNY ──
  'cmqqzwaed003j1gtye6ycfa2g': 'Green Apple, Magnolia, White Amber, Sandalwood, Musk, Cashmere',

  // ── DOLCE & GABBANA ──
  'cmqqzwama003k1gtys74rr3dh': 'Neroli, Jasmine, Sandalwood, Vanilla, Musk, Amber',
  'cmqqzwauv003l1gtyj5omquwd': 'Lily, Jasmine, Intense Amber, Vanilla, Patchouli, Musk',
  'cmqqzwb2t003m1gty8l638hvr': 'Bergamot, Cardamom, Leather, Vetiver, Amber, Sandalwood',
  'cmqqzwbaw003n1gtyyl8rr609': 'Sicilian Lemon, Apple, Bamboo, Cedarwood, Musk, Amber',
  'cmqqzwbj5003o1gty5woqwbxd': 'Lemon, Apple, Bamboo, Rose, Amber, Musk',
  'cmqqzwbre003p1gty1k27fa24': 'Bergamot, Neroli, Basil, Tobacco, Amber, Musk',
  'cmqqzwbza003q1gtyi4y8bbo4': 'Violet, Rose, Iris, Coffee, Vanilla, Cedarwood',
  'cmqqzwc74003r1gtying7ikge': 'Bergamot, Apple, Violet, Musk, Sandalwood, Amber',

  // ── DUNHILL ──
  'cmqqzwmub00531gtyoxksvvlj': 'Grapefruit, Black Pepper, Iris, Leather, Sandalwood, Amber',

  // ── ESTÉE LAUDER ──
  'cmqqzwcmz003t1gtydjgzfi4j': 'Jasmine, Iris, Blonde Wood, Musk, Sandalwood, Amber',
  'cmqqzwcf1003s1gtyemqsw4bv': 'Jasmine, Magnolia, Blonde Wood, Musk, Sandalwood, Amber',

  // ── EX NIHILO ──
  'cmqqzwcv0003u1gtynwedkgb2': 'Marine, Blue Iris, Sandalwood, Musk, Amber, Aquatic Notes',
  'cmqqzwd2x003v1gty17isouo0': 'Narcissus, Jasmine, Amber, Musk, Sandalwood, Vanilla',

  // ── FRÉDÉRIC MALLE ──
  'cmqqzwdar003w1gtygbwlpz6n': 'Rose, Cinnamon, Cloves, Patchouli, Sandalwood, Musk',

  // ── GISADA ──
  'cmqqzwe7600401gtygkpa0le1': 'Bergamot, Black Pepper, Amber, Sandalwood, Vetiver, Musk',
  'cmqqzwef200411gtyte7nngsu': 'Bergamot, Rose, Jasmine, Amber, Sandalwood, Musk',
  'cmqqzwemy00421gty07nk5491': 'Titanium, Aqua, Amber, Sandalwood, Musk, Cedarwood',

  // ── GIVENCHY ──
  'cmqqzwev100431gtyy67ozwss': 'Black Pepper, Iris, Cypress, Amber, Vetiver, Leather',
  'cmqqzwf2w00441gty094df07m': 'Bergamot, Iris, Hawthorn, Vetiver, Amber, Musk',
  'cmqqzwfar00451gty55gkwet9': 'Amber, Iris, Warm Spices, Sandalwood, Musk, Vetiver',
  'cmqqzwfio00461gtye41p0cm0': 'Iris, Tonka Bean, Amber, Sandalwood, Musk, Leather',
  'cmqqzwfqf00471gty1imiwucd': 'Iris, Geranium, Amber, Cedar, Vetiver, Musk',
  'cmqqzwfyi00481gtyatoiq5b0': 'Rose, Magnolia, Peony, Amber, Sandalwood, Musk',
  'cmqqzwg6e00491gty7nr48iyv': 'White Florals, Patchouli, Cedarwood, Sandalwood, Musk, Amber',
  'cmqqzwgec004a1gtyamxx4zt0': 'Mandarin, Jasmine, Patchouli, Vetiver, Amber, Musk',
  'cmqqzwgma004b1gtycou08cs7': 'Rose, Mandarin, Patchouli, Amber, Sandalwood, Musk',
  'cmqqzwgu5004c1gty9ludmatb': 'Bergamot, Tuberose, Jasmine, Amber, Patchouli, Musk',
  'cmqqzwh1y004d1gty40l0mfyg': 'Tuberose, Black Pepper, Iris, Sandalwood, Amber, Musk',
  'cmqqzwha0004e1gtywjl3m3d2': 'Bergamot, Lavender, Mandarin, Sandalwood, Cedar, Amber',
  'cmqqzwhi6004f1gtye2ploj5h': 'Vetiver, Amber, Sandalwood, Cedar, Musk, Oakmoss',

  // ── GUCCI ──
  'cmqqzwhq1004g1gtyds9v4z09': 'Bamboo, Rose, Orange Flower, Sandalwood, Musk, Amber',
  'cmqqzwhyz004h1gty7pjh6xoh': 'Tuberose, Rose, Jasmine, Sandalwood, White Musk, Amber',
  'cmqqzwi6x004i1gtyip198zs7': 'Bergamot, Jasmine, Gardenia, Sandalwood, Musk, Amber',
  'cmqqzwiez004j1gtycpegcczc': 'Magnolia, Pineapple, Bergamot, Sandalwood, Musk, Amber',
  'cmqqzwimw004k1gtyxzfw559n': 'Orchid, Sandalwood, Rose, Amber, Musk, Patchouli',
  'cmqqzwj2q004m1gtyhqwswkju': 'Mandarin, Pink Pepper, Amber, Patchouli, Sandalwood, Musk',
  'cmqqzwiur004l1gty6ezwxf4w': 'Citrus, Mandarin, Lavender, Amber, Cedarwood, Musk',
  'cmqqzwjar004n1gtyc46b0pjo': 'Bergamot, Cognac, Black Pepper, Sandalwood, Amber, Leather',

  // ── GUERLAIN ──
  'cmqqzwjil004o1gtykkc3o3of': 'Cherry, Rose, Oud, Amber, Sandalwood, Musk',
  'cmqqzwjqa004p1gty2sdcckxk': 'Rose, Cherry, Raspberry, Sandalwood, Amber, Musk',
  'cmqqzwjy2004q1gty1vwt4eum': 'Tobacco, Honey, Labdanum, Amber, Sandalwood, Musk',

  // ── HERMÈS ──
  'cmqqzwk5v004r1gtyjvkf372x': 'Leather, Amber, Sandalwood, Vetiver, Musk, Incense',
  'cmqqzwkdm004s1gtyt299n0rc': 'Bergamot, Sea Salt, Mineral Notes, Sandalwood, Musk, Amber',
  'cmqqzwkm0004t1gty0ghrwy7h': 'Rose, Magnolia, Iris, Sandalwood, Musk, Amber',
  'cmqqzxyfb00ar1gty57544qym': 'Grapefruit, Pepper, Flint, Vetiver, Amber, Sandalwood',

  // ── HUGO BOSS ──
  'cmqqzwktz004u1gty1313hh9q': 'Apple, Geranium, Cinnamon, Sandalwood, Vetiver, Musk',
  'cmqqzwl2g004v1gtyxhedoeop': 'Bergamot, Cardamom, Amber, Sandalwood, Vetiver, Musk',
  'cmqqzwlab004w1gtywkj9nk1p': 'Apple, Spearmint, Lavender, Sandalwood, Cedar, Musk',
  'cmqqzwly8004z1gtyfrt8j9jw': 'Bergamot, Leather, Amber, Sandalwood, Vetiver, Musk',
  'cmqqzwlq3004y1gty4035ewx9': 'Ginger, Amber, Iris, Sandalwood, Vetiver, Musk',
  'cmqqzwli3004x1gtympm4py51': 'Bergamot, Ginger, Tonka Bean, Sandalwood, Amber, Musk',
  'cmqqzwmm800521gtyu6xlqhmg': 'Ginger, Lavender, Amber, Sandalwood, Leather, Musk',
  'cmqqzwm6g00501gtytmy34bnn': 'Bergamot, Black Pepper, Amber, Cedarwood, Vetiver, Musk',
  'cmqqzwmef00511gtyyadt32x1': 'Ginger, Lavender, Black Pepper, Amber, Patchouli, Musk',

  // ── INITIO ──
  'cmqqzwn2600541gtym275mf23': 'Musk, Sandalwood, Amber, Vanilla, Tonka Bean, Benzoin',
  'cmqqzwna300551gtyc8llxnng': 'Oud, Saffron, Leather, Amber, Musk, Sandalwood',
  'cmqqzwni000561gtyc34v996c': 'Bergamot, Vanilla, Rum, Vetiver, Amber, Musk',

  // ── JEAN PAUL GAULTIER ──
  'cmqqzwpqs005f1gtypa1vrfva': 'Vanilla, Iris, Musk, Amber, Sandalwood, Rose',
  'cmqqzwpyl005g1gtyvyrcy0kc': 'Orange Blossom, Galbanum, Sandalwood, Amber, Musk, Cedarwood',
  'cmqqzwq7t005h1gty2lmgtbn6': 'Jasmine, Aldehyde, Sandalwood, Amber, Musk, Iris',
  'cmqqzwqfq005i1gtyfd35x7xi': 'Cherry, Bergamot, Amber, Vanilla, Sandalwood, Musk',
  'cmqqzwqnm005j1gtypqlkqav4': 'Peach, Jasmine, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzwrej005m1gty7eblqp45': 'Coconut, Sandalwood, Amber, Musk, Vanilla, Bergamot',
  'cmqqzwqvt005k1gtymifxmqqg': 'Cardamom, Tonka Bean, Sandalwood, Amber, Vanilla, Musk',
  'cmqqzwr63005l1gtywolk1n6i': 'Orange Blossom, Galbanum, Vetiver, Sandalwood, Amber, Musk',
  'cmqqzwrmd005n1gtybek5nqh4': 'Vanilla, Mint, Cardamom, Amber, Sandalwood, Leather',
  'cmqqzwruf005o1gtygiw9f6d1': 'Lavender, Vanilla, Amber, Sandalwood, Musk, Tonka Bean',
  'cmqqzws29005p1gtyq4qa0e75': 'Vanilla, Lavender, Mint, Amber, Sandalwood, Musk',
  'cmqqzwsas005q1gtyou5cuim7': 'Ginger, Cardamom, Vanilla, Amber, Sandalwood, Musk',
  'cmqqzwslx005r1gty7p2bokbz': 'Bergamot, Jasmine, Amber, Honey, Sandalwood, Musk',
  'cmqqzwsuy005s1gtycbfsmpzj': 'Bergamot, Amber, Vanilla, Sandalwood, Leather, Musk',
  'cmqqzwt2w005t1gtys4pocgse': 'Bergamot, Lemon, Grapefruit, Amber, Cedar, Musk',
  'cmqqzwtap005u1gtyouira1kr': 'Bergamot, Jasmine, Honey, Amber, Sandalwood, Musk',
  'cmqqzwtiq005v1gty7r234ib1': 'Bergamot, Lavender, Vanilla, Tonka Bean, Amber, Musk',

  // ── JO MALONE ──
  'cmqqzwnqd00571gtyvbar031e': 'Blackberry, Bay Leaf, Cedarwood, Vetiver, Musk, Amber',
  'cmqqzwnya00581gtyg98r88m9': 'Dark Amber, Ginger Lily, Sandalwood, Musk, Patchouli, Amber',
  'cmqqzwo6b00591gtyrsoqqhra': 'Pear, Freesia, Rose, Amber, Musk, Patchouli',
  'cmqqzwoig005a1gtyjhh5y6rx': 'Myrrh, Tonka Bean, Sandalwood, Amber, Musk, Vanilla',
  'cmqqzwova005b1gty9ib3xou4': 'Orange Blossom, White Lily, Musk, Amber, Sandalwood, Vetiver',
  'cmqqzwp36005c1gtywyu7q5gr': 'Peony, Blush Suede, Amber, Musk, Sandalwood, Rose',
  'cmqqzwpb7005d1gtyiiabbgup': 'Scarlet Poppy, Cassis, Rose, Amber, Sandalwood, Musk',
  'cmqqzwpj2005e1gty2v6j7wr0': 'Sea Salt, Wood Sage, Vetiver, Musk, Cedarwood, Amber',

  // ── KAJAL ──
  'cmqqzwtql005w1gtyul0gsozh': 'Rose, Amber, Oud, Sandalwood, Saffron, Musk',
  'cmqqzwtyi005x1gtyqe64krvk': 'Jasmine, Rose, Amber, Oud, Sandalwood, Musk',
  'cmqqzwu6l005y1gtyhk36r3l0': 'Rose, Amber, Oud, Saffron, Sandalwood, Musk',
  'cmqqzwuel005z1gty0i095puk': 'Rose, Oud, Amber, Sandalwood, Musk, Saffron',

  // ── KAYALI ──
  'cmqqzwuml00601gty3fll94qo': 'Apple, Strawberry, Peach, Rose, Amber, Musk',
  'cmqqzwuug00611gty5tucl1zh': 'Bergamot, Rose, Sandalwood, Amber, Musk, Oud',
  'cmqqzwv2e00621gty8327ba9z': 'Cherry, Plum, Rose, Amber, Patchouli, Musk',
  'cmqqzwvaa00631gtykbwk9t0h': 'Oud, Vanilla, Amber, Sandalwood, Rose, Musk',
  'cmqqzwvi600641gtyd8xetnzw': 'Pink Pepper, Lemon, Rose, Amber, Musk, Sandalwood',
  'cmqqzwvpz00651gtyce1xn452': 'Vanilla, Amber, Sandalwood, Musk, Tonka Bean, Benzoin',
  'cmqqzwvxr00661gtyhwrtc1gt': 'Vanilla, Candy, Rock Sugar, Amber, Musk, Sandalwood',
  'cmqqzww5p00671gtyrl4y9b11': 'Marshmallow, Vanilla, Amber, Musk, Sandalwood, Caramel',
  'cmqqzwwds00681gtyf3gwpj41': 'Pistachio, Vanilla, Amber, Musk, Sandalwood, Cream',

  // ── KENZO ──
  'cmqqzwwll00691gty247y2yao': 'Lavender, Juniper, Mint, Sandalwood, Amber, Musk',
  'cmqqzwwte006a1gtyppo2i7wm': 'Bergamot, Eucalyptus, Cedar, Amber, Musk, Vetiver',
  'cmqqzwx1g006b1gtyslelt39b': 'Jasmine, Ylang Ylang, Mango, Sandalwood, Amber, Musk',
  'cmqqzwx9j006c1gtykwp2rtio': 'Citrus, Aquatic Notes, Musk, Sandalwood, Amber, Vetiver',

  // ── KILIAN ──
  'cmqqzwxhe006d1gtyqz8idq1o': 'Cognac, Cinnamon, Cloves, Oak, Tonka Bean, Vanilla',
  'cmqqzwxpk006e1gty7a5t1ln8': 'Cognac, Cinnamon, Cloves, Oak, Tonka Bean, Vanilla',
  'cmqqzwxyo006f1gtyvcdlo8iu': 'Cognac, Cinnamon, Vanilla, Oak, Tonka Bean, Amber',
  'cmqqzwyek006h1gtyztqzwwct': 'Peach, Rose, Iris, Sandalwood, Musk, Amber',
  'cmqqzwy6j006g1gtycdvi9x7n': 'Peach, Rose, Iris, Sandalwood, Musk, Amber',
  'cmqqzwymj006i1gty1iy6uxz4': 'Absinthe, Mint, Violet, Musk, Sandalwood, Amber',
  'cmqqzwyul006j1gtyovu5h9i2': 'Bourbon, Orange Bitters, Walnut, Amber, Sandalwood, Musk',
  'cmqqzwz2h006k1gtyjm3ad36c': 'Rose, Peach, Raspberry, Amber, Sandalwood, Musk',

  // ── LACOSTE ──
  'cmqqzwzle006m1gtyqxfsdd6y': 'Citrus, Aquatic Notes, White Musk, Sandalwood, Cedar, Vetiver',
  'cmqqzwzt5006n1gty0dlczlxd': 'Cardamom, Leather, Amber, Sandalwood, Vetiver, Musk',
  'cmqqzx09r006p1gty7zdt5r6k': 'Peony, Magnolia, Amber, Musk, Sandalwood, Vanilla',
  'cmqqzx01c006o1gty75ijy59q': 'Peony, Magnolia, Amber, Musk, Sandalwood, Vanilla',

  // ── LANCÔME ──
  'cmqqzwzbz006l1gtyvjxkhfvs': 'Iris, Patchouli, Sandalwood, Amber, Musk, Vanilla',
  'cmqqzx0in006q1gtyozu7asea': 'Rose, Jasmine, Patchouli, Amber, Musk, Vanilla',
  'cmqqzx0qk006r1gty6n7nspa9': 'Bergamot, Praline, Rose, Amber, Sandalwood, Musk',
  'cmqqzx0yp006s1gty9671ddfv': 'Rose, Jasmine, Sandalwood, Amber, Musk, Vanilla',
  'cmqqzx16i006t1gtyl1ujnfjo': 'Iris, Praline, Patchouli, Amber, Sandalwood, Musk',
  'cmqqzx1em006u1gtye7chk04e': 'Bergamot, Rose, Jasmine, Patchouli, Amber, Sandalwood',
  'cmqqzx1me006v1gtyjj3nn93s': 'Bergamot, Rose, Lily, Sandalwood, Amber, Musk',

  // ── LATTAFA ──
  'cmqqzx226006x1gtyvkmwnw04': 'Bergamot, Cardamom, Oud, Amber, Sandalwood, Musk',
  'cmqqzx1u8006w1gty4eula9xc': 'Cloves, Bergamot, Oud, Amber, Sandalwood, Musk',
  'cmqqzx2ao006y1gtyma9ikmzr': 'Oud, Amethyst, Rose, Amber, Sandalwood, Musk',
  'cmqqzx2in006z1gtyk7uaew8t': 'Oud, Honor, Saffron, Amber, Sandalwood, Musk',
  'cmqqzx2qi00701gtymilmgd72': 'Oud, Rose, Amber, Sandalwood, Musk, Incense',
  'cmqqzx2ym00711gtyycjh436m': 'Oud, Vanilla, Amber, Sandalwood, Rose, Musk',
  'cmqqzx3n400741gtycx41qbtu': 'Wine, Rose, Oud, Amber, Sandalwood, Musk',
  'cmqqzx36m00721gty7wfjpvi4': 'Smoke, Oud, Amber, Sandalwood, Musk, Incense',
  'cmqqzx3ek00731gtyrw2mtaml': 'Coffee, Oud, Amber, Sandalwood, Musk, Cardamom',
  'cmqqzx3uz00751gty766768yc': 'Rose, Musk, Amber, Sandalwood, Vanilla, Oud',
  'cmqqzx42t00761gtyefao0d7i': 'Pink, Musk, Rose, Amber, Sandalwood, Vanilla',
  'cmqqzx4ay00771gtyqbgiedng': 'Lotus, Musk, Rose, Amber, Sandalwood, Vanilla',
  'cmqqzx4il00781gtyl4lslqnp': 'Oud, Saffron, Amber, Rose, Sandalwood, Musk',

  // ── LOUIS VUITTON ──
  'cmqqzx4qi00791gtyh3kn24jn': 'Bergamot, Aquatic, Sandalwood, Musk, Amber, Vetiver',
  'cmqqzx4yb007a1gtycty4qqy6': 'Bergamot, Jasmine, Rose, Amber, Sandalwood, Musk',
  'cmqqzx55z007b1gtyyj8hlv4j': 'Peach, Rose, Jasmine, Amber, Sandalwood, Musk',
  'cmqqzx5dr007c1gty4zfmbd10': 'Cactus Flower, Oud, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzx5lv007d1gty19m1pvxi': 'Citrus, Amber, Sandalwood, Musk, Vetiver, Cedar',
  'cmqqzx5tm007e1gtylc2kuqv2': 'Iris, Amber, Sandalwood, Musk, Vetiver, Cedar',
  'cmqqzx61e007f1gtydroqvxgt': 'Jasmine, Rose, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzx697007g1gtyx2cnwg8s': 'Fire, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzx6h1007h1gty3y91e3so': 'Oud, Amber, Rose, Sandalwood, Musk, Incense',
  'cmqqzx6os007i1gty3czp3iv2': 'Citrus, Aquatic, Amber, Sandalwood, Musk, Vetiver',

  // ── MAISON CRIVELLI ──
  'cmqqzx6wt007j1gtyt62ts3ap': 'Tuberose, Amber, Sandalwood, Musk, Vanilla, Floral',
  'cmqqzx74k007k1gtye9ich0lg': 'Iris, Musk, Amber, Sandalwood, Vanilla, Floral',
  'cmqqzx7ch007l1gtygfycjuc0': 'Oud, Maracuja, Amber, Sandalwood, Musk, Incense',
  'cmqqzx7k9007m1gtypm54z3hz': 'Oud, Leather, Amber, Sandalwood, Musk, Incense',

  // ── MAISON FRANCIS KURKDJIAN ──
  'cmqqzxc7q00871gtyxuvejfvt': 'Rose, Sandalwood, Amber, Musk, Oud, Bergamot',
  'cmqqzxcfq00881gty478cy7ur': 'Labdanum, Musk, Benzoin, Amber, Sandalwood, Incense',
  'cmqqzxcns00891gtyulu84d5r': 'Amyris, Amber, Sandalwood, Musk, Vetiver, Cedarwood',
  'cmqqzxcvq008a1gtynj48ofu6': 'Bergamot, Mandarin, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzxd3m008b1gtyw6z3lwhj': 'Jasmine, Amber, Sandalwood, Musk, Fir Resin, Rose',
  'cmqqzxdbg008c1gtymqov0mzi': 'Jasmine, Amber, Sandalwood, Musk, Fir Resin, Cedar',
  'cmqqzxdja008d1gtyiyb5c4np': 'Amber, Benzoin, Tonka Bean, Sandalwood, Musk, Incense',
  'cmqqzxdrd008e1gtylhco0y1d': 'Bergamot, Cardamom, Amber, Sandalwood, Musk, Oud',
  'cmqqzxdza008f1gtyzefj0tze': 'Oud, Rose, Vanilla, Amber, Sandalwood, Musk',

  // ── MANCERA ──
  'cmqqzx7s1007n1gtyvvbu0ox5': 'Rose, Bergamot, Amber, Musk, Sandalwood, Jasmine',
  'cmqqzx800007o1gtys4b2mn1e': 'Tobacco, Red Cherry, Amber, Musk, Sandalwood, Vanilla',

  // ── MARC JACOBS ──
  'cmqqzx8gj007q1gtyuk841bgu': 'Plum, Iris, Amber, Sandalwood, Musk, Leather',

  // ── MARC-ANTOINE BARROIS ──
  'cmqqzx885007p1gtyedswvmmk': 'Bergamot, Sandalwood, Amber, Musk, Vetiver, Cedar',

  // ── MATIÈRE PREMIÈRE ──
  'cmqqzx8oi007r1gtyekeaq09r': 'Vanilla, Iris, Musk, Sandalwood, Amber, Heliotrope',

  // ── MEMO ──
  'cmqqzx8wc007s1gtyyz2n49fe': 'Leather, Bergamot, Cedar, Amber, Musk, Sandalwood',
  'cmqqzx94a007t1gtyi1td5bsb': 'Honey, Dragon Blood, Amber, Sandalwood, Musk, Oud',
  'cmqqzx9cw007u1gtyotfz1wo4': 'Scottish Highland, Whisky, Amber, Sandalwood, Musk, Cedarwood',
  'cmqqzx9kv007v1gtyz2ii3atq': 'Mediterranean Sea, Citrus, Amber, Musk, Sandalwood, Vetiver',
  'cmqqzx9sx007w1gtyrnpe1pzq': 'Iris, Violet, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzxa0n007x1gtya1tdejxs': 'Oud, Rose, Amber, Sandalwood, Musk, Incense',
  'cmqqzxa8g007y1gtyhhib9c44': 'Peach, Rose, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzxaga007z1gtyullnkyoi': 'Jasmine, Cardamom, Amber, Sandalwood, Musk, Oud',
  'cmqqzxao400801gtysy2qouec': 'Bergamot, Texas, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzxaw800811gtyz0vwv9im': 'Oud, Leather, Amber, Sandalwood, Musk, Incense',
  'cmqqzxb4600821gty5hub225n': 'Moonflower, Amber, Sandalwood, Musk, Vanilla, Iris',
  'cmqqzxbce00831gtyvng0nxat': 'Leather, Oud, Amber, Sandalwood, Musk, Incense',
  'cmqqzxbka00841gty0zvedjkk': 'Rose, Iris, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzxbs300851gtyygbo6qrj': 'Himalayan, Iris, Amber, Sandalwood, Musk, Spices',
  'cmqqzxbzr00861gty7ny3cg4a': 'Winter, Iris, Amber, Sandalwood, Musk, Spices',

  // ── MICHAEL KORS ──
  'cmqqzxe74008g1gtye96yy34y': 'Bergamot, Peony, Rose, Sandalwood, Musk, Amber',
  'cmqqzxef4008h1gtyiaa92viv': 'Bergamot, Amber, Sandalwood, Musk, Vetiver, Cedar',

  // ── MONTALE ──
  'cmqqzxeut008j1gty0suzy63a': 'Rose, Musk, Sandalwood, Amber, Vetiver, Bergamot',
  'cmqqzxf2x008k1gty2g06qq3u': 'Frankincense, Oud, Amber, Sandalwood, Musk, Incense',
  'cmqqzxfar008l1gty9jfhhhul': 'Tonka Bean, Rose, Amber, Sandalwood, Musk, Spices',

  // ── MONTBLANC ──
  'cmqqzxfit008m1gty3zakzskw': 'Bergamot, Cardamom, Vetiver, Sandalwood, Amber, Musk',
  'cmqqzxfqr008n1gtybnard0id': 'Bergamot, Aquatic, Vetiver, Sandalwood, Amber, Musk',
  'cmqqzxfyo008o1gtyxsrpjoiw': 'Rose, Iris, Sandalwood, Musk, Amber, Vanilla',

  // ── MOSCHINO ──
  'cmqqzxg6o008p1gtyydm5lwqo': 'Bubble Gum, Peach, Amber, Musk, Vanilla, Sandalwood',
  'cmqqzxgen008q1gtyyi1w1mdr': 'Peach, Iris, Amber, Musk, Vanilla, Sandalwood',

  // ── MUGLER ──
  'cmqqzxgmo008r1gtypbu10zko': 'Jasmine, Heliotrope, Cassia, Amber, Sandalwood, Musk',
  'cmqqzxguh008s1gtywt74h84t': 'Jasmine, Leather, Amber, Sandalwood, Musk, Benzoin',
  'cmqqzxh2b008t1gtyozgp4sm7': 'Jasmine, Bourbon Vanilla, Amber, Sandalwood, Musk, Benzoin',
  'cmqqzxhaj008u1gtykg77oqhl': 'Angel Accord, Vanilla, Patchouli, Amber, Sandalwood, Musk',

  // ── NARCISO RODRIGUEZ ──
  'cmqqzxhyg008x1gtye5dihv9r': 'Rose, Musk, Amber, Sandalwood, Cedarwood, Patchouli',
  'cmqqzxi6q008y1gty7gz6dnd1': 'Musk, Rose, Amber, Cedarwood, Sandalwood, Patchouli',
  'cmqqzxieo008z1gtyjs79nmpw': 'Musk, Rose, Amber, Cedarwood, Sandalwood, Patchouli',
  'cmqqzximj00901gty5zu89skv': 'White Florals, Musk, Amber, Sandalwood, Cedarwood, Rose',
  'cmqqzxivb00911gtyjxpeuyz4': 'Musk, Jasmine, Amber, Sandalwood, Cedarwood, Iris',
  'cmqqzxj3e00921gtyoar6xxfx': 'Rose, Musk, Amber, Sandalwood, Cedarwood, Patchouli',
  'cmqqzxjbi00931gtyhtjzu4it': 'Magnolia, Musk, Amber, Sandalwood, Cedarwood, Rose',
  'cmqqzxjje00941gty9goo250t': 'Rose, Spices, Amber, Sandalwood, Musk, Cedarwood',
  'cmqqzxjrf00951gtyt3nasjjz': 'Rose, Musk, Amber, Sandalwood, Cedarwood, Patchouli',

  // ── NASOMATTO ──
  'cmqqzxjzt00961gty3rvvp6m1': 'Hashish, Afghan Black, Oud, Amber, Incense, Musk',
  'cmqqzxk8a00971gtyabpuiyaq': 'Silver Musk, White Musk, Sandalwood, Amber, Iris, Vetiver',

  // ── ORTO PARISI ──
  'cmqqzxkge00981gtyj6z2wf22': 'Bergamot, Labdanum, Amber, Sandalwood, Musk, Incense',

  // ── PACO RABANNE ──
  'cmqqzxkoc00991gty369y0vxs': 'Platinum, Amber, Sandalwood, Musk, Vetiver, Cedar',
  'cmqqzxkwz009a1gtywidut0es': 'Mango, Iris, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzxl5k009b1gtyfxe5xzsu': 'Marine Notes, Grapefruit, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxlek009c1gtyrkp16mpw': 'Amber, Grapefruit, Sandalwood, Musk, Cedar, Incense',
  'cmqqzxlng009d1gtyybf7ubrz': 'Amber, Grapefruit, Sandalwood, Musk, Cedar, Vetiver',
  'cmqqzxlve009e1gtyv7q23fut': 'Neroli, Jasmine, Amber, Honey, Sandalwood, Musk',
  'cmqqzxm3i009f1gty7p5guiwj': 'Neroli, Jasmine, Empire, Honey, Sandalwood, Musk',
  'cmqqzxmbz009g1gtyyph6qr4v': 'Neroli, Jasmine, Amber, Sandalwood, Musk, Aquatic',
  'cmqqzxmlc009h1gtyznd7vx40': 'Neroli, Jasmine, Legend, Sandalwood, Musk, Amber',
  'cmqqzxpn6009q1gtysgo491ff': 'Bergamot, Grapefruit, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxmvh009i1gty7g31dts6': 'Bergamot, Grapefruit, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxnl4009l1gty0ldtlojb': 'Gold, Amber, Sandalwood, Musk, Cedar, Bergamot',
  'cmqqzxn3r009j1gtyiesozb0s': 'Gold, Jasmine, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxnbv009k1gtyfsyy3bzm': 'Gold, Jasmine, Sandalwood, Musk, Amber, Cedar',
  'cmqqzxnth009m1gty2z7zjcri': 'Bergamot, Grapefruit, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxonw009n1gtyd0owo11g': 'Bergamot, Grapefruit, Amber, Sandalwood, Musk, Leather',
  'cmqqzxozv009o1gty2u35bkbd': 'Bergamot, Grapefruit, Amber, Sandalwood, Musk, Tonka Bean',
  'cmqqzxp91009p1gty6yehzrqi': 'Bergamot, Grapefruit, Amber, Sandalwood, Musk, Royal Accord',
  'cmqqzxpy0009r1gty6bfvu6gi': 'Lavender, Iris, Amber, Sandalwood, Musk, Vanilla',

  // ── PANTHEON ROMA ──
  'cmqqzxq6r009s1gtya0vn2hzl': 'Rose, Amber, Sandalwood, Musk, Oud, Incense',

  // ── PARFUMS DE MARLY ──
  'cmqqzxqex009t1gtywjyeaukw': 'Bergamot, Juniper, Sandalwood, Amber, Musk, Vetiver',
  'cmqqzxqn1009u1gtyg5plmplz': 'Bergamot, Iris, Sandalwood, Amber, Musk, Vetiver',
  'cmqqzxqv1009v1gty0gk91v09': 'Bergamot, Cardamom, Iris, Sandalwood, Amber, Musk',
  'cmqqzxrba009x1gty69jii29h': 'Bergamot, Lavender, Sandalwood, Amber, Musk, Vetiver',
  'cmqqzxr39009w1gtykietmh2e': 'Bergamot, Lavender, Sandalwood, Amber, Musk, Vetiver',
  'cmqqzxrj8009y1gty9ivj13q2': 'Bergamot, Iris, Sandalwood, Amber, Musk, Vetiver',
  'cmqqzxrrd009z1gtytg53p1rz': 'Litchi, Rose, Peony, Amber, Musk, Sandalwood',
  'cmqqzxrza00a01gty19n79kgx': 'Litchi, Magnolia, Rose, Amber, Musk, Sandalwood',
  'cmqqzxs7000a11gty4jyh8pmt': 'Bergamot, Cardamom, Sandalwood, Amber, Musk, Vetiver',
  'cmqqzxsf300a21gtycjcnsgbr': 'Bergamot, Citrus, Sandalwood, Amber, Musk, Vetiver',
  'cmqqzxsmy00a31gty756nsezn': 'Bergamot, Sandalwood, Amber, Musk, Vetiver, Cedar',
  'cmqqzxsus00a41gtyclerzx91': 'Bergamot, Cardamom, Sandalwood, Amber, Musk, Vetiver',
  'cmqqzxt2w00a51gtya8hmm9zh': 'Bergamot, Rose, Sandalwood, Amber, Musk, Vetiver',
  'cmqqzxtav00a61gtycwivkxsy': 'Bergamot, Iris, Sandalwood, Amber, Musk, Vetiver',
  'cmqqzxtj100a71gtywvxbuw9g': 'Peony, Rose, Sandalwood, Amber, Musk, Vetiver',

  // ── PHILIPP PLEIN ──
  'cmqqzxtqu00a81gtywka2yj5o': 'Bergamot, Amber, Sandalwood, Musk, Vetiver, Cedar',

  // ── PRADA ──
  'cmqqzxtyo00a91gty9j817o65': 'Benzaldehyde, Sandalwood, Amber, Musk, Vetiver, Cedar',
  'cmqqzxu6j00aa1gtygvs9c0d0': 'Iris, Amber, Sandalwood, Musk, Vetiver, Cedar',
  'cmqqzxujp00ab1gtyrnbgmomm': 'Iris, Vetiver, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxusf00ac1gty17vt4rdq': 'Bergamot, Aquatic, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxvqq00af1gtyehjeng43': 'Marine, Bergamot, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxvau00ad1gty30siphdb': 'Marine, Carbon, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxvit00ae1gtydhr7yowk': 'Marine, Sport, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxvyo00ag1gty9glxzgdq': 'Marine, Ocean, Amber, Sandalwood, Musk, Cedar',
  'cmqqzxw6i00ah1gtyc6kl6rpi': 'Iris, Amber, Sandalwood, Musk, Vetiver, Cedar',
  'cmqqzxweg00ai1gty196hwy5n': 'Neroli, Amber, Sandalwood, Musk, Vetiver, Iris',
  'cmqqzxwmv00aj1gtyjttetbuj': 'Neroli, Intense, Amber, Sandalwood, Musk, Iris',
  'cmqqzxwux00ak1gtyq0kcismb': 'Neroli, Radical, Amber, Sandalwood, Musk, Iris',
  'cmqqzxx2r00al1gtyxc2sq6ek': 'Neroli, Flower, Amber, Sandalwood, Musk, Iris',

  // ── ROBERTO CAVALLI ──
  'cmqqzxxb100am1gty2dbjs8dj': 'Rose, Peony, Amber, Sandalwood, Musk, Vanilla',

  // ── STÉPHANE HUMBERT LUCAS ──
  'cmqqzxxiv00an1gtyh2gnox2d': 'Fire, Oud, Amber, Sandalwood, Musk, Incense',
  'cmqqzxxr800ao1gtyf4xctuel': 'Pink, Oud, Amber, Sandalwood, Musk, Incense',
  'cmqqzxxz200ap1gty9jlskoms': 'Sand, Oud, Amber, Sandalwood, Musk, Incense',
  'cmqqzxy7200aq1gtyxo21pe6r': 'Venom, Oud, Amber, Sandalwood, Musk, Incense',

  // ── TIZIANA TERENZI ──
  'cmqqzxyqc00as1gtyt581nmmi': 'Bergamot, Rose, Amber, Sandalwood, Musk, Oud',
  'cmqqzxz5800at1gtye5nb4qwy': 'Bergamot, Rose, Amber, Sandalwood, Musk, Oud',
  'cmqqzxzds00au1gtykhu1ykie': 'Bergamot, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzxzlj00av1gtyot5y8ub1': 'Bergamot, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzxztc00aw1gty1l7tw3ke': 'Bergamot, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzy01d00ax1gty5kai4gt3': 'Bergamot, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzy09c00ay1gtygdlpbmwo': 'Bergamot, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzy0h800az1gtysu7k9h82': 'Bergamot, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzy0p400b01gty10ie21ij': 'Bergamot, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzy0x100b11gtye03sisuk': 'Bergamot, Amber, Sandalwood, Musk, Oud, Incense',

  // ── TOM FORD ──
  'cmqqzy14u00b21gty3wqwzwcl': 'Bergamot, Lime, Aquatic, Sandalwood, Musk, Amber',
  'cmqqzy1cm00b31gty6fefcy9r': 'Bitter Peach, Rum, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzy1kk00b41gty56urh9e8': 'Lacquer, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzy1sd00b51gty5nsi5y24': 'Black Orchid, Truffle, Amber, Sandalwood, Musk, Patchouli',
  'cmqqzy20l00b61gtyz4z3pyor': 'Cherry, Smoke, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzy28m00b71gtysaasonkr': 'Vanilla, Grapefruit, Amber, Sandalwood, Musk, Iris',
  'cmqqzy2h900b81gtygqbipafq': 'Pepper, Vetiver, Amber, Sandalwood, Musk, Cedarwood',
  'cmqqzy2ut00b91gtyf6gga7s3': 'Cherry, Plum, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzy33x00ba1gtytvjjdr63': 'Mandarin, Lemon, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzy3bt00bb1gtyn0zos71v': 'Rose, Amber, Sandalwood, Musk, Metallic, Iris',
  'cmqqzy3js00bc1gty3dm1nytp': 'Oud, Rose, Amber, Sandalwood, Musk, Incense',
  'cmqqzy3rr00bd1gty21oyuln5': 'Violet, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzy3zv00be1gtynfa2v75h': 'Mandarin, Amber, Sandalwood, Musk, Oud, Incense',
  'cmqqzy47n00bf1gtymtzd3gnv': 'Leather, Sage, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzy4fo00bg1gtytm56a8cj': 'Oud, Mineral, Amber, Sandalwood, Musk, Incense',
  'cmqqzy4nk00bh1gty1idnn3ag': 'Oud, Mineral, Amber, Sandalwood, Musk, Incense',
  'cmqqzy4vg00bi1gty9zdynp62': 'Oud, Cedarwood, Amber, Sandalwood, Musk, Incense',
  'cmqqzy53900bj1gty6duwv8u7': 'Rose, Amber, Sandalwood, Musk, Vetiver, Cedarwood',
  'cmqqzy5b300bk1gtyp2o50kuw': 'Rose, Prickly, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzy5j800bl1gtymagh8jy3': 'Tobacco, Vanilla, Amber, Sandalwood, Musk, Tonka Bean',
  'cmqqzy5r500bm1gtymu8yy47k': 'Leather, Tobacco, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzy5yv00bn1gtyyxawkcnw': 'Vanilla, Amber, Sandalwood, Musk, Tonka Bean, Benzoin',
  'cmqqzy66r00bo1gtyr3my5zuw': 'Vanilla, Amber, Sandalwood, Musk, Rose, Jasmine',
  'cmqqzy6em00bp1gty29o62jpk': 'Orchid, Amber, Sandalwood, Musk, Vanilla, Incense',

  // ── VALENTINO ──
  'cmqqzy73d00bs1gty5jwftwvr': 'Bergamot, Rose, Bourbon, Amber, Musk, Sandalwood',
  'cmqqzy6n900bq1gtynetky58a': 'Green, Rose, Amber, Musk, Sandalwood, Vetiver',
  'cmqqzy6v900br1gtylxyr7bhw': 'Rose, Intense, Amber, Musk, Sandalwood, Vanilla',
  'cmqqzy8fs00bw1gtyzudd0h2b': 'Bergamot, Vanilla, Amber, Musk, Sandalwood, Cedar',
  'cmqqzy7c800bt1gty0mmjxssr': 'Coral, Bergamot, Amber, Musk, Sandalwood, Vanilla',
  'cmqqzy7l700bu1gtye5xrloyk': 'Bergamot, Intense, Amber, Musk, Sandalwood, Vanilla',
  'cmqqzy7t200bv1gtyg7xev6he': 'Yellow, Bergamot, Amber, Musk, Sandalwood, Vanilla',
  'cmqqzy8pa00bx1gtyiqdh5wqj': 'Bergamot, Lavender, Amber, Musk, Sandalwood, Cedar',
  'cmqqzy95x00bz1gtyvi9iiqqv': 'Bergamot, Jasmine, Amber, Musk, Sandalwood, Iris',
  'cmqqzy8x900by1gtytn7i352l': 'Bergamot, Jasmine, Intense, Amber, Musk, Sandalwood',

  // ── VERSACE ──
  'cmqqzy9g900c01gty5eurrguh': 'Peony, Rose, Magnolia, Amber, Musk, Sandalwood',
  'cmqqzy9o700c11gty9vd4st3n': 'Watermelon, Emerald, Amber, Musk, Sandalwood, Rose',
  'cmqqzy9w800c21gty3kno6kba': 'Tuberose, Gardenia, Amber, Musk, Sandalwood, Rose',
  'cmqqzya4a00c31gty2nnou03w': 'Citrus, Marine, Amber, Musk, Sandalwood, Vetiver',
  'cmqqzyaci00c41gtyiagctij8': 'Mint, Vanilla, Tonka Bean, Amber, Sandalwood, Musk',
  'cmqqzyalk00c51gtybyd46aqc': 'Bergamot, Mint, Amber, Sandalwood, Musk, Cedar',
  'cmqqzyatq00c61gty93zv77p7': 'Lemon, Black Pepper, Amber, Sandalwood, Musk, Cedar',
  'cmqqzyb1z00c71gtyqjszijz1': 'Bergamot, Pepper, Amber, Sandalwood, Musk, Cedar',
  'cmqqzyba700c81gty0v14fxxl': 'Lemon, Neroli, Amber, Musk, Sandalwood, Rose',
  'cmqqzybio00c91gty76kmy0kh': 'Lemon, Cardamom, Amber, Musk, Sandalwood, Cedar',
  'cmqqzybr100ca1gtyfv3xwdu3': 'Violet, Peony, Amber, Musk, Sandalwood, Cedar',
  'cmqqzybz500cb1gty2v961fvn': 'Bergamot, Lemon, Amber, Musk, Sandalwood, Cedar',

  // ── VICTORIA'S SECRET ──
  'cmqqzyc7e00cc1gty8vn7uff4': 'Passion Fruit, Peony, Vanilla, Musk, Sandalwood, Amber',
  'cmqqzydn800ci1gty2jvdqisp': 'Musk, Jasmine, Amber, Sandalwood, Vanilla, Rose',

  // ── VIKTOR & ROLF ──
  'cmqqzycfq00cd1gtyxghwxwel': 'Praline, Caramel, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzycpg00ce1gtyw60oe7nz': 'Rose, Jasmine, Freesia, Amber, Sandalwood, Patchouli',
  'cmqqzycxl00cf1gtywmihemt2': 'Rose, Jasmine, Nectar, Amber, Sandalwood, Patchouli',
  'cmqqzyd6c00cg1gtyrzfhwo9d': 'Black Pepper, Cardamom, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzydf400ch1gty1m9pvskg': 'Black Pepper, Cardamom, Amber, Sandalwood, Musk, Vetiver',

  // ── XERJOFF ──
  'cmqqzydv600cj1gtyjnrjeht5': 'Honey, Tobacco, Jasmine, Amber, Sandalwood, Musk',
  'cmqqzye3900ck1gtyn0bmrzn8': 'Marine, Citrus, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzyeba00cl1gtybzagyb15': 'Bergamot, Rose, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzyej400cm1gtylnws2b4p': 'Bergamot, Rose, Intense, Amber, Sandalwood, Musk',
  'cmqqzyer800cn1gtyhckvxgmw': 'Rose, Jasmine, Amber, Sandalwood, Musk, Oud',
  'cmqqzyezl00co1gty7jn47cwk': 'Gold, Bergamot, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzyf7w00cp1gtyxgubirbh': 'Bergamot, Iris, Amber, Sandalwood, Musk, Patchouli',
  'cmqqzyffs00cq1gtyv326d6ie': 'Tropical, Citrus, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzyfoi00cr1gtyj9jtx5ag': 'Bergamot, Tobacco, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzyfxh00cs1gtyghcnifxf': 'Bergamot, Citrus, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzyg5w00ct1gty5ved7jyh': 'Rose, Jasmine, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzygdt00cu1gtym41ew1l3': 'Bergamot, Citrus, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzyglt00cv1gty86dlhbuq': 'Rose, Bergamot, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzygu000cw1gtyf3gbokc9': 'Bergamot, Intense, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzyh2g00cx1gtylfxcbeny': 'Purple, Bergamot, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzyhag00cy1gtyhu7ntpxv': 'Rose, Oud, Amber, Sandalwood, Musk, Saffron',

  // ── YSL ──
  'cmqqzvqcd00141gtyv5bgofdd': 'Coffee, Jasmine, Glitter, Amber, Sandalwood, Musk',
  'cmqqzyhip00cz1gty5itrqfyk': 'Vanilla, Cashmeran, Amber, Sandalwood, Musk, Iris',
  'cmqqzyhr200d01gtyfnk26a50': 'Coffee, Jasmine, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzyi0a00d11gtytn873m8d': 'Bergamot, Lavender, Amber, Sandalwood, Musk, Cedar',
  'cmqqzyiev00d21gty6470rrgm': 'Berry, Jasmine, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzyinh00d31gtypf6fnaf8': 'Orange Blossom, Lavender, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzyivv00d41gtylljowr7q': 'Lavender, Intense, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzyj3x00d51gtyoqcznjl6': 'Flames, Jasmine, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzyjdm00d61gtypecs7xtu': 'Platinum, Jasmine, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzyka600d71gtyrrfmp2ib': 'Rose, Jasmine, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzyl1a00d81gty3h5s4lfp': 'Bergamot, Iris, Amber, Sandalwood, Musk, Patchouli',
  'cmqqzym4x00da1gty27qqx49q': 'Bergamot, Cardamom, Amber, Sandalwood, Musk, Cedar',
  'cmqqzylfm00d91gty38uswbig': 'Bergamot, Cardamom, Intense, Amber, Sandalwood, Musk',
  'cmqqzymfm00db1gtydo4ea49r': 'Rose, Jasmine, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzymol00dc1gtyzz0h65o1': 'Tuxedo, Patchouli, Amber, Sandalwood, Musk, Spices',
  'cmqqzymyv00dd1gtyryxoqs0z': 'Bergamot, Ginger, Amber, Sandalwood, Musk, Cedar',
  'cmqqzyn7v00de1gtynirmv789': 'Bergamot, Intense, Amber, Sandalwood, Musk, Cedar',

  // ── ZADIG & VOLTAIRE ──
  'cmqqzynfz00df1gty8km0hu18': 'Blackcurrant, Rose, Sandalwood, Amber, Musk, Vanilla',
  'cmqqzynnu00dg1gtygss0nyoc': 'Bergamot, Amber, Sandalwood, Musk, Cedar, Vetiver',

  // ── ZOOLOGIST ──
  'cmqqzynvs00dh1gtyixd4jstj': 'Beeswax, Honey, Pollen, Amber, Sandalwood, Musk',
  'cmqqzyo3s00di1gtysvzi1c0a': 'Sand, Musk, Amber, Sandalwood, Vetiver, Incense',
  'cmqqzyobv00dj1gty29du44dg': 'Rock Hyrax, Leather, Amber, Sandalwood, Musk, Incense',
  'cmqqzyojo00dk1gty6ej2wotk': 'Bamboo, Iris, Amber, Sandalwood, Musk, Vetiver',
  'cmqqzyot000dl1gtypc530p7n': 'Ice, Snow, Aquatic, Amber, Sandalwood, Musk',
  'cmqqzyp2d00dm1gtym34s8586': 'Snow, Feathers, Amber, Sandalwood, Musk, Vanilla',
  'cmqqzypaf00dn1gtyk8otb0fs': 'Sea, Brine, Amber, Sandalwood, Musk, Aquatic',
  'cmqqzypig00do1gty9ya1dnoc': 'Tiger Lily, Amber, Sandalwood, Musk, Vetiver, Incense',
  'cmqqzypqe00dp1gtyn3y7hvrh': 'Fossil, Earth, Amber, Sandalwood, Musk, Incense',
};

async function main() {
  let updated = 0;
  const entries = Object.entries(SCENTS);

  for (const [id, scentNotes] of entries) {
    try {
      await prisma.product.update({ where: { id }, data: { scentNotes } });
      updated++;
    } catch { /* ID bulunamadı, atla */ }
    if (updated % 50 === 0 && updated > 0) console.log(`✅ ${updated}/${entries.length} güncellendi...`);
  }

  console.log(`\n✅ Toplam ${updated} ürüne koku notası eklendi.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
