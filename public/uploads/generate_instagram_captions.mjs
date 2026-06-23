import { promises as fs } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const files = (await fs.readdir(cwd))
  .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
  .sort((a, b) => a.localeCompare(b, 'tr'));

const brandOverrides = new Map([
  ['212', 'Carolina Herrera'],
  ['amouage', 'Amouage'],
  ['arman', 'Giorgio Armani'],
  ['armani', 'Giorgio Armani'],
  ['azzaro', 'Azzaro'],
  ['burberry', 'Burberry'],
  ['bvlgari', 'Bvlgari'],
  ['byredo', 'Byredo'],
  ['calvin', 'Calvin Klein'],
  ['carner', 'Carner Barcelona'],
  ['carolina', 'Carolina Herrera'],
  ['caroline', 'Carolina Herrera'],
  ['cartier', 'Cartier'],
  ['casamorati', 'Xerjoff Casamorati'],
  ['chanel', 'Chanel'],
  ['chloe', 'Chloé'],
  ['christian', 'Dior'],
  ['clive', 'Clive Christian'],
  ['creed', 'Creed'],
  ['dior', 'Dior'],
  ['dkny', 'DKNY'],
  ['dolce', 'Dolce & Gabbana'],
  ['estee', 'Estée Lauder'],
  ['ex', 'Ex Nihilo'],
  ['frederic', 'Frédéric Malle'],
  ['giorgio', 'Giorgio Armani'],
  ['gisada', 'Gisada'],
  ['givenchy', 'Givenchy'],
  ['gucci', 'Gucci'],
  ['guerlain', 'Guerlain'],
  ['hermes', 'Hermès'],
  ['hugo', 'Hugo Boss'],
  ['icon', 'Dunhill'],
  ['initio', 'Initio Parfums Privés'],
  ['jo', 'Jo Malone'],
  ['jpg', 'Jean Paul Gaultier'],
  ['kajal', 'Kajal'],
  ['kayali', 'KAYALI'],
  ['kenzo', 'Kenzo'],
  ['kilian', 'Kilian'],
  ['lacoste', 'Lacoste'],
  ['lancome', 'Lancôme'],
  ['lattafa', 'Lattafa'],
  ['lattafe', 'Lattafa'],
  ['lv', 'Louis Vuitton'],
  ['maison', 'Maison Crivelli'],
  ['mancera', 'Mancera'],
  ['marc', 'Marc-Antoine Barrois'],
  ['matiere', 'Matière Première'],
  ['memo', 'Memo Paris'],
  ['mfk', 'Maison Francis Kurkdjian'],
  ['michael', 'Michael Kors'],
  ['miss', 'Miss Dior'],
  ['montale', 'Montale'],
  ['montblanc', 'Montblanc'],
  ['moschino', 'Moschino'],
  ['mugler', 'Mugler'],
  ['my', 'Burberry'],
  ['narciso', 'Narciso Rodriguez'],
  ['nasomatto', 'Nasomatto'],
  ['orto', 'Orto Parisi'],
  ['paco', 'Paco Rabanne'],
  ['pantheon', 'Pantheon Roma'],
  ['parfums', 'Parfums de Marly'],
  ['pdm', 'Parfums de Marly'],
  ['philipp', 'Philipp Plein'],
  ['prada', 'Prada'],
  ['roberto', 'Roberto Cavalli'],
  ['stephane', 'Stephane Humbert Lucas'],
  ['terre', 'Hermès'],
  ['tiziana', 'Tiziana Terenzi'],
  ['tom', 'Tom Ford'],
  ['valentino', 'Valentino'],
  ['versace', 'Versace'],
  ['victorias', "Victoria's Secret"],
  ['viktor', 'Viktor&Rolf'],
  ['vs', "Victoria's Secret"],
  ['xerjoff', 'Xerjoff'],
  ['ysl', 'Yves Saint Laurent'],
  ['zadig', 'Zadig & Voltaire'],
  ['zoologist', 'Zoologist'],
]);

const stopTokens = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'edp', 'edt', 'ldp', 'parfum', 'perfume', 'eau',
  'de', 'du', 'des', 'la', 'le', 'les', 'l', 'for', 'with', 'and', 'the', 'of',
  'pour', 'men', 'women', 'homme', 'femme', 'intense', 'limited', 'edition',
  'royal', 'essence',
]);

const cleanup = (value) => value
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/&/g, ' and ')
  .replace(/'/g, ' ')
  .replace(/[^a-zA-Z0-9]+/g, ' ')
  .trim();

const titleCase = (value) => value
  .split(/\s+/)
  .filter(Boolean)
  .map((word) => {
    const lower = word.toLowerCase();
    if (['edp', 'edt', 'ldp'].includes(lower)) return lower.toUpperCase();
    if (['de', 'du', 'des', 'la', 'le', 'les', 'l', 'of', 'and', 'the', 'for', 'with', 'to'].includes(lower)) {
      return lower;
    }
    if (/^\d+$/.test(word)) return word;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  })
  .join(' ');

const detectBrand = (baseName) => {
  const firstToken = baseName.split('-')[0].toLowerCase();
  return brandOverrides.get(firstToken) || titleCase(cleanup(firstToken));
};

const detectGenderTag = (baseName) => {
  const lower = baseName.toLowerCase();
  if (/(men|homme|him|pour-homme|man)\b/.test(lower)) return '#erkekparfum';
  if (/(women|woman|femme|her|pour-femme)\b/.test(lower)) return '#kadinparfum';
  return '#unisexparfum';
};

const productTag = (baseName, brandToken) => {
  const tokens = baseName
    .toLowerCase()
    .split('-')
    .filter(Boolean)
    .filter((token) => !stopTokens.has(token) && !/^\d+$/.test(token) && !/^\d+ml$/.test(token) && token !== brandToken.toLowerCase());
  const joined = tokens.slice(0, 3).map((token) => cleanup(token).replace(/\s+/g, '').toLowerCase()).join('');
  return joined ? `#${joined}` : '';
};

const genericTags = [
  '#acarliuksparfumeri',
  '#parfum',
  '#nicheparfum',
  '#luxuryperfume',
  '#designerfragrance',
  '#kalicikoku',
];

const makeCaption = (fileName) => {
  const baseName = fileName.replace(/\.(jpe?g|png|webp)$/i, '');
  const brand = detectBrand(baseName);
  const prettyName = titleCase(baseName.replace(/-/g, ' '));
  const brandToken = baseName.split('-')[0];
  const tags = [
    ...genericTags,
    detectGenderTag(baseName),
    `#${cleanup(brand).replace(/\s+/g, '').toLowerCase()}`,
    productTag(baseName, brandToken),
  ].filter(Boolean);
  const uniqueTags = [...new Set(tags)];
  return `Acar Lüks Parfümeri seçkisinde yer alan ${prettyName}, stilinize zarif ve kalıcı bir dokunuş katar. ${uniqueTags.join(' ')}\nSTK: `;
};

const output = [];
output.push('# Acar Lüks Parfümeri Instagram Açıklama Taslağı');
output.push('');
output.push('_Tüm açıklamaların sonunda `STK:` boş bırakılmıştır._');
output.push('');

for (const fileName of files) {
  output.push(`### ${fileName}`);
  output.push(makeCaption(fileName));
  output.push('');
}

const outputPath = path.join(cwd, 'instagram-aciklamalar.md');
await fs.writeFile(outputPath, output.join('\n'), 'utf8');
console.log(`Created ${outputPath} with ${files.length} entries.`);
