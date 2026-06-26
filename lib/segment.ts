export const SEGMENT_LABELS: Record<string, string> = {
  BRONZE: "Bronz Üye",
  SILVER: "Gümüş Üye",
  GOLD:   "Altın Üye",
};

export const SEGMENT_COLORS: Record<string, string> = {
  BRONZE: "bg-amber-700  text-white",
  SILVER: "bg-slate-400  text-white",
  GOLD:   "bg-yellow-500 text-white",
};

// Fallback oranlar (DB boşsa)
export const DEFAULT_DISCOUNTS: Record<string, number> = {
  BRONZE: 0.30,
  SILVER: 0.40,
  GOLD:   0.60,
};

/** Segment fiyatı hesapla. rates: { BRONZE: 30, SILVER: 40, GOLD: 60 } (yüzde cinsinden) */
export function getSegmentPrice(
  basePrice: number,
  segment: string | null | undefined,
  rates?: Record<string, number>,
): number | null {
  if (!segment) return null;
  let discount: number;
  if (rates && rates[segment] != null) {
    discount = rates[segment] / 100;
  } else {
    discount = DEFAULT_DISCOUNTS[segment] ?? 0;
  }
  if (!discount) return null;
  return Math.round(basePrice * (1 - discount));
}
