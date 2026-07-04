"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { addToCart } from "@/lib/actions/cart";
import CartItemRow from "./CartItemRow";
import { calcDisplayPrice, SEGMENT_LABELS, SEGMENT_COLORS, type SegmentPricingSettings } from "@/lib/segment";

interface Product {
  id: string; name: string; price: unknown; costPrice?: unknown; brand?: { name: string; slug: string } | null;
  images: string[]; slug: string;
}
interface CartItem { id: string; quantity: number; customPrice?: unknown; product: Product; }
interface CrossSellProduct {
  id: string; name: string; slug: string; price: number; comparePrice: number | null;
  images: string[]; brand?: { name: string; slug?: string } | null;
}

export default function LoggedInCart({
  items,
  crossSellProducts = [],
  userSegment = null,
  isB2B = false,
  b2bMarkup = null,
  segmentSettings,
}: {
  items: CartItem[];
  crossSellProducts?: CrossSellProduct[];
  userSegment?: string | null;
  isB2B?: boolean;
  b2bMarkup?: number | null;
  segmentSettings?: SegmentPricingSettings;
}) {
  const [addedCrossSell, setAddedCrossSell] = useState<Set<string>>(new Set());
  const [crossPending, startCrossT] = useTransition();

  const originalTotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const segmentTotal  = items.reduce((s, i) => {
    if (i.customPrice != null) return s + Number(i.customPrice) * i.quantity;
    const cp = i.product.costPrice != null ? Number(i.product.costPrice) : null;
    const { displayPrice } = calcDisplayPrice(Number(i.product.price), cp, isB2B, b2bMarkup, userSegment, segmentSettings);
    return s + displayPrice * i.quantity;
  }, 0);
  const segmentDiscount = Math.round(originalTotal - segmentTotal);

  function addCrossSellToCart(product: CrossSellProduct) {
    const discountedPrice = Math.round(product.price * 0.7);
    startCrossT(async () => {
      await addToCart(product.id, 1, discountedPrice);
      setAddedCrossSell((prev) => new Set([...prev, product.id]));
      window.location.reload();
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#E8E4DE] bg-white">
        <p className="font-serif text-5xl text-[#C4A882] opacity-20 mb-5">◈</p>
        <h2 className="font-serif text-xl text-[#1A1A1A] mb-2">Sepetiniz boş</h2>
        <p className="font-sans text-sm text-[#9A9A9A] mb-6">Beğendiğiniz ürünleri ekleyin.</p>
        <Link href="/" className="font-sans text-[11px] tracking-[0.25em] uppercase border border-[#1A1A1A] text-[#1A1A1A] px-8 py-3 hover:bg-[#1A1A1A] hover:text-white transition-colors">
          Alışverişe Devam Et
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Ürünler */}
        <div className="md:col-span-2 space-y-3">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} userSegment={userSegment} isB2B={isB2B} b2bMarkup={b2bMarkup} segmentSettings={segmentSettings} />
          ))}
        </div>

        {/* Özet paneli */}
        <div className="md:col-span-1">
          <div className="bg-white border border-[#E8E4DE] p-6 sticky top-24 space-y-5">
            <h2 className="font-serif text-lg text-[#1A1A1A] pb-4 border-b border-[#E8E4DE]">Sipariş Özeti</h2>

            {isB2B ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded font-sans text-xs bg-[#1A1A1A] text-[#C4A882]">
                <span className="font-semibold">Bayi Fiyatı Uygulandı</span>
              </div>
            ) : userSegment && SEGMENT_LABELS[userSegment] && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded font-sans text-xs ${SEGMENT_COLORS[userSegment]}`}>
                <span className="font-semibold">{SEGMENT_LABELS[userSegment]} İndirimi Uygulandı</span>
              </div>
            )}

            <div className="space-y-2">
              {items.map((i) => {
                const cp = i.product.costPrice != null ? Number(i.product.costPrice) : null;
                const { displayPrice: sp } = calcDisplayPrice(Number(i.product.price), cp, isB2B, b2bMarkup, userSegment, segmentSettings);
                const lineTotal = (i.customPrice != null ? Number(i.customPrice) : sp) * i.quantity;
                return (
                  <div key={i.id} className="flex justify-between font-sans text-xs text-[#6B6B6B]">
                    <span className="truncate pr-2">{i.product.name} ×{i.quantity}</span>
                    <span className="shrink-0">{lineTotal.toLocaleString("tr-TR")} ₺</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#E8E4DE] pt-4 space-y-1">
              {segmentDiscount > 0 && (
                <div className="flex justify-between font-sans text-xs text-[#6B6B6B]">
                  <span>Liste fiyatı</span>
                  <span>{originalTotal.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
              {segmentDiscount > 0 && (
                <div className="flex justify-between font-sans text-xs text-[#C4A882] font-medium">
                  <span>{isB2B ? "Bayi Fiyatı" : (SEGMENT_LABELS[userSegment!] + " İndirimi")}</span>
                  <span>−{segmentDiscount.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
              <div className="flex justify-between font-sans text-sm font-semibold text-[#1A1A1A] pt-1 border-t border-[#E8E4DE]">
                <span>Toplam</span>
                <span>{segmentTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors"
            >
              Siparişi Ver
            </Link>
            <Link href="/" className="block text-center font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors">
              Alışverişe Devam Et
            </Link>
          </div>
        </div>
      </div>

      {/* Cross-sell önerileri — bayilere gösterme */}
      {!isB2B && crossSellProducts.length > 0 && (
        <section className="border-t border-[#E8E4DE] pt-8">
          <div className="mb-6">
            <p className="font-sans text-[10px] tracking-[0.4em] text-[#C4A882] uppercase mb-1">Özel Teklif</p>
            <h2 className="font-serif text-xl text-[#1A1A1A]">Size Özel %30 İndirim</h2>
            <p className="font-sans text-xs text-[#9A9A9A] mt-1">Bu ürünlerden birini sepetinize ekleyin, %30 indirimli fiyattan satın alın.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {crossSellProducts.map((p) => {
              const discountedPrice = Math.round(p.price * 0.7);
              const isAdded = addedCrossSell.has(p.id);
              const img = p.images?.[0] ?? null;
              return (
                <div key={p.id} className="bg-white border border-[#E8E4DE] flex flex-col group">
                  <div className="relative overflow-hidden bg-[#F5F0EA]" style={{ aspectRatio: "4/5" }}>
                    <Link href={`/urunler/${p.slug}`} className="absolute inset-0" />
                    {img ? (
                      <Image src={img} alt={p.name} fill sizes="(max-width:768px) 50vw, 25vw"
                        className="object-contain p-3 group-hover:scale-[1.03] transition-transform duration-500 pointer-events-none" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-serif text-4xl text-[#C4A882] opacity-20">◈</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-[#C4A882] text-white text-[9px] tracking-widest uppercase px-2 py-0.5">
                      %30 İndirim
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    {p.brand?.name && (
                      <Link href={`/urunler?marka=${encodeURIComponent(p.brand.slug ?? p.brand.name)}`} className="font-sans text-[8px] tracking-[0.2em] text-[#C4A882] mb-1 hover:text-[#8B6F4E] transition-colors block">
                        {p.brand.name}
                      </Link>
                    )}
                    <Link href={`/urunler/${p.slug}`}>
                      <h3 className="font-serif text-xs leading-snug text-[#1A1A1A] hover:text-[#C4A882] line-clamp-2 mb-2">{p.name}</h3>
                    </Link>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-sans text-sm font-semibold text-[#C4A882]">{discountedPrice.toLocaleString("tr-TR")} ₺</span>
                      <span className="font-sans text-xs text-[#9A9A9A] line-through">{p.price.toLocaleString("tr-TR")} ₺</span>
                    </div>
                    <button type="button" onClick={() => addCrossSellToCart(p)} disabled={isAdded || crossPending}
                      className="mt-auto font-sans text-[10px] tracking-widest uppercase py-2 border transition-colors disabled:opacity-50 w-full border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white">
                      {isAdded ? "✓ Eklendi" : "Sepete Ekle"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
