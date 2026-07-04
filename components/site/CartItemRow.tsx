"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { updateCartItem, removeFromCart } from "@/lib/actions/cart";
import { calcDisplayPrice, type SegmentPricingSettings } from "@/lib/segment";

interface CartItemRowProps {
  item: {
    id:          string;
    quantity:    number;
    customPrice?: unknown;
    product: {
      id:        string;
      name:      string;
      slug:      string;
      price:     unknown;
      costPrice?: unknown;
      images:    string[];
      brand?: { name: string; slug: string } | null;
    };
  };
  userSegment?:     string | null;
  isB2B?:           boolean;
  b2bMarkup?:       number | null;
  segmentSettings?: SegmentPricingSettings;
}

export default function CartItemRow({ item, userSegment, isB2B = false, b2bMarkup = null, segmentSettings }: CartItemRowProps) {
  const [pending, startTransition] = useTransition();
  const price     = Number(item.product.price);
  const costPrice = item.product.costPrice != null ? Number(item.product.costPrice) : null;
  const { displayPrice: segmentedPrice, originalPrice, label, labelColor } = calcDisplayPrice(price, costPrice, isB2B, b2bMarkup, userSegment, segmentSettings);
  // customPrice (cross-sell indirimli fiyat) varsa onu kullan
  const customPriceNum = item.customPrice != null ? Number(item.customPrice) : null;
  const displayPrice   = customPriceNum ?? segmentedPrice;
  const crossSellLabel = customPriceNum != null && customPriceNum < price ? "%30 İndirim" : null;
  const img = item.product.images?.[0] ?? null;

  const update = (qty: number) =>
    startTransition(async () => { await updateCartItem(item.id, qty); });

  const remove = () =>
    startTransition(async () => { await removeFromCart(item.id); });

  return (
    <div className={`flex gap-4 bg-white border border-[#E8E4DE] p-4 transition-opacity ${pending ? "opacity-50" : ""}`}>
      {/* Görsel */}
      <Link href={`/urunler/${item.product.slug}`} className="w-20 h-24 bg-[#F7F4F0] shrink-0 relative overflow-hidden block">
        {img ? (
          <Image src={img} alt={item.product.name} fill className="object-contain p-2 hover:scale-[1.03] transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-[#C4A882] opacity-20">◈</div>
        )}
      </Link>

      {/* Bilgi */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {item.product.brand?.name && (
            <Link href={`/urunler?marka=${item.product.brand.slug}`}
              className="font-sans text-[9px] tracking-[0.2em] text-[#C4A882] mb-0.5 hover:text-[#8B6F4E] transition-colors block">
              {item.product.brand.name}
            </Link>
          )}
          <Link href={`/urunler/${item.product.slug}`} className="font-sans text-sm text-[#1A1A1A] leading-snug line-clamp-2 hover:text-[#C4A882] transition-colors">
            {item.product.name}
          </Link>
          {(crossSellLabel || label) ? (
            <div className="mt-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className={`font-sans text-[9px] px-1.5 py-0.5 rounded font-semibold ${crossSellLabel ? "bg-orange-100 text-orange-700" : labelColor}`}>
                  {crossSellLabel ?? label}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-sm font-semibold text-[#C4A882]">
                  {(displayPrice * item.quantity).toLocaleString("tr-TR")} ₺
                </span>
                <span className="font-sans text-xs text-[#9A9A9A] line-through">
                  {(price * item.quantity).toLocaleString("tr-TR")} ₺
                </span>
              </div>
            </div>
          ) : (
            <p className="font-sans text-sm font-semibold text-[#1A1A1A] mt-1">
              {(displayPrice * item.quantity).toLocaleString("tr-TR")} ₺
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Miktar */}
          <div className="flex items-center border border-[#E8E4DE]">
            <button
              onClick={() => update(item.quantity - 1)}
              disabled={pending}
              className="w-8 h-8 flex items-center justify-center font-sans text-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F0EA] transition-colors"
            >−</button>
            <span className="w-8 h-8 flex items-center justify-center font-sans text-sm text-[#1A1A1A]">
              {item.quantity}
            </span>
            <button
              onClick={() => update(item.quantity + 1)}
              disabled={pending}
              className="w-8 h-8 flex items-center justify-center font-sans text-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F0EA] transition-colors"
            >+</button>
          </div>

          {/* Sil */}
          <button
            onClick={remove}
            disabled={pending}
            className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] hover:text-red-500 transition-colors"
          >
            Kaldır
          </button>
        </div>
      </div>
    </div>
  );
}
