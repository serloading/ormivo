export type NormalizedOrderItem = {
  productId?: string;
  name: string;
  qty: number;
  price: number;
};

type RawOrderItem = {
  productId?: string | null;
  name?: unknown;
  productName?: unknown;
  qty?: unknown;
  quantity?: unknown;
  price?: unknown;
};

export function normalizeOrderItem(item: RawOrderItem): NormalizedOrderItem {
  return {
    productId: item.productId ?? undefined,
    name: String(item.name ?? item.productName ?? "Ürün"),
    qty: Math.max(1, Number(item.qty ?? item.quantity ?? 1) || 1),
    price: Math.max(0, Number(item.price ?? 0) || 0),
  };
}

export function normalizeOrderItems(items: unknown): NormalizedOrderItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeOrderItem(item as RawOrderItem));
}
