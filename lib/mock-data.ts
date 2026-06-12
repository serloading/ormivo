export type MockProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: string;
  categorySlug: string;
  stock: number;
  isActive: boolean;
};

export type MockCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export const mockCategories: MockCategory[] = [
  { id: "1", name: "Kadın", slug: "kadin", description: "Kadın parfümleri" },
  { id: "2", name: "Erkek", slug: "erkek", description: "Erkek parfümleri" },
  { id: "3", name: "Unisex", slug: "unisex", description: "Unisex parfümler" },
  {
    id: "4",
    name: "Özel Koleksiyon",
    slug: "ozel-koleksiyon",
    description: "Sınırlı sayıda özel koleksiyon",
  },
];

export const mockProducts: MockProduct[] = [
  {
    id: "1",
    name: "Ambra Noir",
    slug: "ambra-noir",
    description:
      "Derin amber notalarıyla başlayan, vanilya ve misk ile kapanan büyüleyici bir koku. Gece için idealdir.",
    price: 890,
    comparePrice: 1100,
    images: [],
    category: "Kadın",
    categorySlug: "kadin",
    stock: 15,
    isActive: true,
  },
  {
    id: "2",
    name: "Cedar Oud",
    slug: "cedar-oud",
    description:
      "Sedir ağacı ve oud'un güçlü kombinasyonu. Maskülen, kalıcı ve etkileyici bir erkek parfümü.",
    price: 1050,
    images: [],
    category: "Erkek",
    categorySlug: "erkek",
    stock: 8,
    isActive: true,
  },
  {
    id: "3",
    name: "Rose Eternel",
    slug: "rose-eternel",
    description:
      "Taze koparılmış gülün saf kokusu. Pudra tonları ve hafif misk notalarıyla tamamlanan zarif bir parfüm.",
    price: 790,
    images: [],
    category: "Unisex",
    categorySlug: "unisex",
    stock: 22,
    isActive: true,
  },
  {
    id: "4",
    name: "Santal Blanc",
    slug: "santal-blanc",
    description:
      "Beyaz sandal ağacının sıcak ve kremsi dokusu. Ylang-ylang ve bergamot ile açılan sofistike bir koku.",
    price: 950,
    comparePrice: 1150,
    images: [],
    category: "Unisex",
    categorySlug: "unisex",
    stock: 12,
    isActive: true,
  },
  {
    id: "5",
    name: "Iris Lumiere",
    slug: "iris-lumiere",
    description:
      "Iris çiçeğinin topraksı ve pudralı kokusu. İnce, zarif ve unutulmaz.",
    price: 1200,
    images: [],
    category: "Kadın",
    categorySlug: "kadin",
    stock: 5,
    isActive: true,
  },
  {
    id: "6",
    name: "Vetiver Storm",
    slug: "vetiver-storm",
    description:
      "Vetiver, karabiber ve duman notaları. Güçlü karakteri olan modern bir erkek parfümü.",
    price: 980,
    images: [],
    category: "Erkek",
    categorySlug: "erkek",
    stock: 18,
    isActive: true,
  },
];

export function getProductBySlug(slug: string): MockProduct | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): MockProduct[] {
  return mockProducts.filter((p) => p.categorySlug === categorySlug);
}
