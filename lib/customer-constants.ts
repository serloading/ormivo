export const SEGMENTS = ["GOLD", "SILVER", "BRONZE"] as const;
export type Segment = (typeof SEGMENTS)[number];

export const SEGMENT_LABELS: Record<string, string> = {
  GOLD:   "Gold",
  SILVER: "Silver",
  BRONZE: "Bronze",
};

export const SEGMENT_COLORS: Record<string, string> = {
  GOLD:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  SILVER: "bg-gray-100 text-gray-600 border-gray-300",
  BRONZE: "bg-orange-100 text-orange-700 border-orange-300",
};
