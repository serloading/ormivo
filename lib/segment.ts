// Segment indirim oranları
export const SEGMENT_DISCOUNTS: Record<string, number> = {
  BRONZE: 0.30,
  SILVER: 0.40,
  GOLD:   0.60,
};

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

/** Segment fiyatı hesapla (indirimli satış fiyatı) */
export function getSegmentPrice(basePrice: number, segment: string | null | undefined): number | null {
  if (!segment || !SEGMENT_DISCOUNTS[segment]) return null;
  return Math.round(basePrice * (1 - SEGMENT_DISCOUNTS[segment]));
}
