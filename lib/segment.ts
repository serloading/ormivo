export const SEGMENT_LABELS: Record<string, string> = {
  DIAMOND: "Diamond Üye",
  GOLD: "Altın Üye",
  SILVER: "Gümüş Üye",
  BRONZE: "Bronz Üye",
};

export const SEGMENT_COLORS: Record<string, string> = {
  DIAMOND: "bg-cyan-600 text-white",
  GOLD: "bg-yellow-500 text-white",
  SILVER: "bg-slate-400 text-white",
  BRONZE: "bg-amber-700 text-white",
};

// Fallback oranlar (DB boşsa)
export const DEFAULT_DISCOUNTS: Record<string, number> = {
  BRONZE: 0.30,
  SILVER: 0.40,
  GOLD: 0.60,
};

export const DEFAULT_DIAMOND_MARKUP = 500;

export type SegmentPricingSettings = {
  BRONZE?: number;
  SILVER?: number;
  GOLD?: number;
  DIAMOND?: number;
};

const DISCOUNT_SEGMENTS = new Set(["BRONZE", "SILVER", "GOLD"] as const);

/** Segment fiyatı hesapla. Diamond: geliş fiyatı + sabit artış. Diğerleri: yüzde indirimdir. */
export function getSegmentPrice(
  basePrice: number,
  segment: string | null | undefined,
  rates?: SegmentPricingSettings,
  costPrice?: number | null,
): number | null {
  if (!segment) return null;

  if (segment === "DIAMOND") {
    if (costPrice == null || costPrice <= 0) return null;
    const markup = rates?.DIAMOND ?? DEFAULT_DIAMOND_MARKUP;
    return Math.round(costPrice + markup);
  }

  let discount: number;
  if (rates && DISCOUNT_SEGMENTS.has(segment as "BRONZE" | "SILVER" | "GOLD") && rates[segment as "BRONZE" | "SILVER" | "GOLD"] != null) {
    discount = (rates[segment as "BRONZE" | "SILVER" | "GOLD"] as number) / 100;
  } else {
    discount = DEFAULT_DISCOUNTS[segment as "BRONZE" | "SILVER" | "GOLD"] ?? 0;
  }

  if (!discount) return null;
  return Math.round(basePrice * (1 - discount));
}

/**
 * Kullanıcıya göre gösterilecek fiyatı hesaplar.
 * Tüm ürün listelerinde, sepette, favori sayfasında kullanılmalı.
 */
export function calcDisplayPrice(
  price:    number,
  costPrice: number | null | undefined,
  isB2B:    boolean,
  b2bMarkup: number | null | undefined,
  segment:  string | null | undefined,
  segmentSettings?: SegmentPricingSettings | null,
): { displayPrice: number; originalPrice?: number; label?: string; labelColor?: string } {
  // B2B (bayi) → alış fiyatı + kişisel markup
  if (isB2B && costPrice != null && b2bMarkup != null) {
    return {
      displayPrice: Math.round(costPrice + b2bMarkup),
      label:        "Bayi",
      labelColor:   "bg-[#1A1A1A] text-[#C4A882]",
    };
  }

  // Segment indirimi / artışı
  const segPrice = getSegmentPrice(price, segment, segmentSettings ?? undefined, costPrice);
  if (segPrice != null) {
    return {
      displayPrice:  segPrice,
      originalPrice: price,
      label:         SEGMENT_LABELS[segment!],
      labelColor:    SEGMENT_COLORS[segment!],
    };
  }

  return { displayPrice: price };
}
