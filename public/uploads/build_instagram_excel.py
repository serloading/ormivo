from __future__ import annotations

from collections import OrderedDict
from pathlib import Path
import re

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font


ROOT = Path.cwd()
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
OUTPUT_XLSX = ROOT / "instagram-aciklamalar.xlsx"
OUTPUT_MD = ROOT / "instagram-aciklamalar.md"
OUTPUT_PASTE = ROOT / "instagram-kopyala-yapistir.txt"


BRAND_OVERRIDES = {
    "212": "Carolina Herrera",
    "amouage": "Amouage",
    "arman": "Giorgio Armani",
    "armani": "Giorgio Armani",
    "azzaro": "Azzaro",
    "burberry": "Burberry",
    "bvlgari": "Bvlgari",
    "byredo": "Byredo",
    "calvin": "Calvin Klein",
    "carner": "Carner Barcelona",
    "carolina": "Carolina Herrera",
    "caroline": "Carolina Herrera",
    "cartier": "Cartier",
    "casamorati": "Xerjoff Casamorati",
    "chanel": "Chanel",
    "chloe": "Chloé",
    "christian": "Dior",
    "clive": "Clive Christian",
    "creed": "Creed",
    "dior": "Dior",
    "dkny": "DKNY",
    "dolce": "Dolce & Gabbana",
    "estee": "Estée Lauder",
    "ex": "Ex Nihilo",
    "frederic": "Frédéric Malle",
    "giorgio": "Giorgio Armani",
    "gisada": "Gisada",
    "givenchy": "Givenchy",
    "gucci": "Gucci",
    "guerlain": "Guerlain",
    "hermes": "Hermès",
    "hugo": "Hugo Boss",
    "icon": "Dunhill",
    "initio": "Initio Parfums Privés",
    "jo": "Jo Malone",
    "jpg": "Jean Paul Gaultier",
    "kajal": "Kajal",
    "kayali": "KAYALI",
    "kenzo": "Kenzo",
    "kilian": "Kilian",
    "lacoste": "Lacoste",
    "lancome": "Lancôme",
    "lattafa": "Lattafa",
    "lattafe": "Lattafa",
    "lv": "Louis Vuitton",
    "maison": "Maison Crivelli",
    "mancera": "Mancera",
    "marc": "Marc-Antoine Barrois",
    "matiere": "Matière Première",
    "memo": "Memo Paris",
    "mfk": "Maison Francis Kurkdjian",
    "michael": "Michael Kors",
    "miss": "Miss Dior",
    "montale": "Montale",
    "montblanc": "Montblanc",
    "moschino": "Moschino",
    "mugler": "Mugler",
    "my": "Burberry",
    "narciso": "Narciso Rodriguez",
    "nasomatto": "Nasomatto",
    "orto": "Orto Parisi",
    "paco": "Paco Rabanne",
    "pantheon": "Pantheon Roma",
    "parfums": "Parfums de Marly",
    "pdm": "Parfums de Marly",
    "philipp": "Philipp Plein",
    "prada": "Prada",
    "roberto": "Roberto Cavalli",
    "stephane": "Stephane Humbert Lucas",
    "terre": "Hermès",
    "tiziana": "Tiziana Terenzi",
    "tom": "Tom Ford",
    "valentino": "Valentino",
    "versace": "Versace",
    "victorias": "Victoria's Secret",
    "viktor": "Viktor&Rolf",
    "vs": "Victoria's Secret",
    "xerjoff": "Xerjoff",
    "ysl": "Yves Saint Laurent",
    "zadig": "Zadig & Voltaire",
    "zoologist": "Zoologist",
}

STOP_TOKENS = {
    "jpg",
    "jpeg",
    "png",
    "webp",
    "edp",
    "edt",
    "ldp",
    "parfum",
    "perfume",
    "eau",
    "de",
    "du",
    "des",
    "la",
    "le",
    "les",
    "l",
    "for",
    "with",
    "and",
    "the",
    "of",
    "pour",
    "men",
    "women",
    "homme",
    "femme",
    "intense",
    "limited",
    "edition",
    "royal",
    "essence",
    "him",
    "her",
    "pourhomme",
    "pourfemme",
    "100ml",
    "90ml",
    "125ml",
    "80ml",
    "75ml",
    "70ml",
    "60ml",
    "50ml",
    "30ml",
    "200ml",
}

GENERIC_TAGS = [
    "#acarliuksparfumeri",
    "#parfum",
    "#nicheparfum",
    "#luxuryperfume",
    "#designerfragrance",
    "#kalicikoku",
]


def cleanup(value: str) -> str:
    value = (
        value.replace("&", " and ")
        .replace("'", " ")
    )
    value = re.sub(r"[^a-zA-Z0-9]+", " ", value)
    return value.strip()


def title_case(value: str) -> str:
    parts = []
    for word in value.split():
        lower = word.lower()
        if lower in {"edp", "edt", "ldp"}:
            parts.append(lower.upper())
        elif lower in {"de", "du", "des", "la", "le", "les", "l", "of", "and", "the", "for", "with", "to"}:
            parts.append(lower)
        elif word.isdigit():
            parts.append(word)
        else:
            parts.append(lower[:1].upper() + lower[1:])
    return " ".join(parts)


def detect_brand(base_name: str) -> str:
    first_token = base_name.split("-")[0].lower()
    return BRAND_OVERRIDES.get(first_token, title_case(cleanup(first_token)))


def detect_gender_tag(base_name: str) -> str:
    lower = base_name.lower()
    if re.search(r"(men|homme|him|pour-homme|man)\b", lower):
        return "#erkekparfum"
    if re.search(r"(women|woman|femme|her|pour-femme)\b", lower):
        return "#kadinparfum"
    return "#unisexparfum"


def product_tag(base_name: str, brand_token: str) -> str:
    tokens = [
        token
        for token in base_name.lower().split("-")
        if token
        and token not in STOP_TOKENS
        and not re.fullmatch(r"\d+", token)
        and not re.fullmatch(r"\d+ml", token)
        and token != brand_token.lower()
    ]
    joined = "".join(cleanup(token).replace(" ", "").lower() for token in tokens[:3])
    return f"#{joined}" if joined else ""


def make_stk(base_name: str) -> str:
    tokens = [token for token in base_name.lower().split("-") if token]
    significant: list[str] = []
    for index, token in enumerate(tokens):
        if token in STOP_TOKENS:
            continue
        if re.fullmatch(r"\d+ml", token):
            continue
        if index == 0 and re.fullmatch(r"\d+", token):
            significant.append(token)
            continue
        if index == 0:
            significant.append(cleanup(token))
            continue
        significant.append(cleanup(token))

    letters = []
    for token in significant:
        cleaned = token.replace(" ", "")
        if cleaned.isdigit():
            letters.append(cleaned)
        else:
            letters.append(cleaned[:1].upper())
    return "".join(letters)


def make_caption(file_name: str) -> tuple[str, str, str, str]:
    base_name = re.sub(r"\.(jpe?g|png|webp)$", "", file_name, flags=re.IGNORECASE)
    brand = detect_brand(base_name)
    pretty_name = title_case(base_name.replace("-", " "))
    stk = make_stk(base_name)
    brand_token = base_name.split("-")[0]
    tags = [
        *GENERIC_TAGS,
        detect_gender_tag(base_name),
        f"#{cleanup(brand).replace(' ', '').lower()}",
        product_tag(base_name, brand_token),
    ]
    hashtags = " ".join(OrderedDict.fromkeys(tag for tag in tags if tag))
    caption = (
        f"Acar Lüks Parfümeri seçkisinde yer alan {pretty_name}, stilinize zarif ve kalıcı bir dokunuş katar. "
        f"{hashtags}\nSTK:{stk}"
    )
    return brand, pretty_name, stk, caption


def main() -> None:
    files = sorted(
        [item.name for item in ROOT.iterdir() if item.is_file() and item.suffix.lower() in IMAGE_EXTS],
        key=lambda value: value.casefold(),
    )

    rows = []
    md_lines = [
        "# Acar Lüks Parfümeri Instagram Açıklama Taslağı",
        "",
        "_Tüm açıklamaların sonunda `STK:` ürün baş harfleriyle doldurulmuştur._",
        "",
    ]
    paste_lines = []

    for file_name in files:
        brand, product_name, stk, caption = make_caption(file_name)
        hashtags = caption.split(" STK:")[0].split(". ", 1)[1]
        rows.append(
            {
                "fileName": file_name,
                "brand": brand,
                "productName": product_name,
                "stk": stk,
                "caption": caption,
                "hashtags": hashtags,
            }
        )
        md_lines.extend([f"### {file_name}", caption, ""])
        paste_lines.extend([product_name, "", caption, ""])

    OUTPUT_MD.write_text("\n".join(md_lines), encoding="utf-8")
    OUTPUT_PASTE.write_text("\n".join(paste_lines), encoding="utf-8")

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Instagram"
    sheet.append(["Dosya Adı", "Marka", "Ürün Adı", "STK", "Instagram Açıklama", "Hashtagler"])
    for row in rows:
        sheet.append([
            row["fileName"],
            row["brand"],
            row["productName"],
            row["stk"],
            row["caption"],
            row["hashtags"],
        ])

    for cell in sheet[1]:
        cell.font = Font(bold=True)

    widths = {
        "A": 48,
        "B": 24,
        "C": 40,
        "D": 14,
        "E": 120,
        "F": 90,
    }
    for column_letter, width in widths.items():
        sheet.column_dimensions[column_letter].width = width

    sheet.freeze_panes = "A2"
    for row in sheet.iter_rows():
        for cell in row:
            cell.alignment = Alignment(vertical="top", wrap_text=True)

    workbook.save(OUTPUT_XLSX)
    print(f"Created {OUTPUT_XLSX} with {len(rows)} rows.")
    print(f"Created {OUTPUT_PASTE} with {len(rows)} blocks.")


if __name__ == "__main__":
    main()
