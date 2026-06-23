export const SEGMENTS = ["VIP", "REGULAR", "NEW", "AT_RISK", "LOST"] as const;
export type Segment = (typeof SEGMENTS)[number];

export const SEGMENT_LABELS: Record<string, string> = {
  VIP:     "VIP",
  REGULAR: "Regular",
  NEW:     "Yeni",
  AT_RISK: "Kaybedilmek Üzere",
  LOST:    "Kayıp",
};

export const SEGMENT_COLORS: Record<string, string> = {
  VIP:     "bg-yellow-100 text-yellow-800 border-yellow-300",
  REGULAR: "bg-gray-100 text-gray-600 border-gray-300",
  NEW:     "bg-blue-100 text-blue-700 border-blue-300",
  AT_RISK: "bg-orange-100 text-orange-700 border-orange-300",
  LOST:    "bg-red-100 text-red-600 border-red-300",
};
