"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { placeOrder } from "@/lib/actions/order-site";
import { validateCoupon } from "@/lib/actions/coupon";
import { addToCart } from "@/lib/actions/cart";
import CartItemRow from "./CartItemRow";
import { getSegmentPrice, SEGMENT_LABELS, SEGMENT_COLORS } from "@/lib/segment";

interface Product {
  id: string; name: string; price: unknown; brand?: { name: string; slug: string } | null;
  images: string[]; slug: string;
}
interface CartItem { id: string; quantity: number; product: Product; }
interface Address {
  id: string; recipientName: string; phone: string;
  addressLine: string; city: string; district: string | null; isDefault: boolean;
}
interface CrossSellProduct {
  id: string; name: string; slug: string; price: number; comparePrice: number | null;
  images: string[]; brand?: { name: string } | null;
}

export default function LoggedInCart({
  items,
  addresses,
  crossSellProducts = [],
  userSegment = null,
}: {
  items: CartItem[];
  addresses: Address[];
  crossSellProducts?: CrossSellProduct[];
  userSegment?: string | null;
}) {
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  const defaultSel = addresses.length > 0 ? `saved:${addresses[0].id}` : "new";
  const [selected, setSelected] = useState(defaultSel);
  const [saveAddr, setSaveAddr] = useState(true);
  const [note,     setNote]     = useState("");
  const [newAddr, setNewAddr]   = useState({ recipientName: "", phone: "", addressLine: "", city: "", district: "" });

  // Kupon kodu
  const [couponInput, setCouponInput]   = useState("");
  const [couponError, setCouponError]   = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon]   = useState("");
  const [couponPending, startCouponT]       = useTransition();

  // Cross-sell
  const [addedCrossSell, setAddedCrossSell] = useState<Set<string>>(new Set());
  const [crossPending, startCrossT]         = useTransition();

  const originalTotal  = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const segmentTotal   = items.reduce((s, i) => {
    const sp = getSegmentPrice(Number(i.product.price), userSegment);
    return s + (sp ?? Number(i.product.price)) * i.quantity;
  }, 0);
  const segmentDiscount = Math.round(originalTotal - segmentTotal);
  const itemsTotal = segmentTotal;
  const total      = Math.max(0, itemsTotal - couponDiscount);

  function applyCoupon() {
    setCouponError("");
    startCouponT(async () => {
      const result = await validateCoupon(couponInput, itemsTotal);
      if (!result.valid) { setCouponError(result.error ?? "Geçersiz kupon."); return; }
      setCouponDiscount(result.discount ?? 0);
      setAppliedCoupon(couponInput.toUpperCase().trim());
      setCouponInput("");
    });
  }

  function removeCoupon() {
    setCouponDiscount(0);
    setAppliedCoupon("");
    setCouponError("");
  }

  function addCrossSellToCart(product: CrossSellProduct) {
    startCrossT(async () => {
      await addToCart(product.id, 1);
      setAddedCrossSell((prev) => new Set([...prev, product.id]));
      window.location.reload();
    });
  }

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    let delivery: { recipientName: string; recipientPhone: string; addressLine: string; city: string; district: string };

    if (selected.startsWith("saved:")) {
      const addr = addresses.find((a) => a.id === selected.replace("saved:", ""));
      if (!addr) { setFormError("Adres bulunamadı."); setSubmitting(false); return; }
      delivery = { recipientName: addr.recipientName, recipientPhone: addr.phone, addressLine: addr.addressLine, city: addr.city, district: addr.district ?? "" };
    } else {
      if (!newAddr.recipientName.trim()) { setFormError("Ad Soyad gerekli."); setSubmitting(false); return; }
      if (!newAddr.phone.trim())         { setFormError("Telefon gerekli.");   setSubmitting(false); return; }
      if (!newAddr.addressLine.trim())   { setFormError("Adres gerekli.");     setSubmitting(false); return; }
      if (!newAddr.city.trim())          { setFormError("Şehir gerekli.");     setSubmitting(false); return; }
      delivery = { recipientName: newAddr.recipientName, recipientPhone: newAddr.phone, addressLine: newAddr.addressLine, city: newAddr.city, district: newAddr.district };
    }

    const result = await placeOrder({
      recipientName:  delivery.recipientName,
      recipientPhone: delivery.recipientPhone,
      addressLine:    delivery.addressLine,
      city:           delivery.city,
      district:       delivery.district,
      note,
      saveAddress:    selected === "new" && saveAddr,
      couponCode:     appliedCoupon || undefined,
      couponDiscount: couponDiscount || undefined,
    });

    setSubmitting(false);
    if (result.error) { setFormError(result.error); return; }
    window.location.href = `/siparis-tamamlandi?orderNo=${result.orderNo}`;
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
        {/* Ürün listesi */}
        <div className="md:col-span-2 space-y-3">
          {items.map((item) => <CartItemRow key={item.id} item={item} userSegment={userSegment} />)}
        </div>

        {/* Özet + sipariş formu */}
        <div className="md:col-span-1">
          <div className="bg-white border border-[#E8E4DE] p-6 sticky top-24 space-y-5">
            <h2 className="font-serif text-lg text-[#1A1A1A] pb-4 border-b border-[#E8E4DE]">Sipariş Özeti</h2>

            {/* Segment rozeti */}
            {userSegment && SEGMENT_LABELS[userSegment] && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded font-sans text-xs ${SEGMENT_COLORS[userSegment]}`}>
                <span className="font-semibold">{SEGMENT_LABELS[userSegment]} İndirimi Uygulandı</span>
              </div>
            )}

            {/* Ürünler */}
            <div className="space-y-2">
              {items.map((i) => {
                const sp = getSegmentPrice(Number(i.product.price), userSegment);
                const lineTotal = (sp ?? Number(i.product.price)) * i.quantity;
                return (
                  <div key={i.id} className="flex justify-between font-sans text-xs text-[#6B6B6B]">
                    <span className="truncate pr-2">{i.product.name} ×{i.quantity}</span>
                    <span className="shrink-0">{lineTotal.toLocaleString("tr-TR")} ₺</span>
                  </div>
                );
              })}
            </div>

            {/* Kupon kodu */}
            {!appliedCoupon ? (
              <div className="border-t border-[#E8E4DE] pt-4">
                <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] mb-2">İndirim Kodu</p>
                <div className="flex flex-col gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                    placeholder="KUPON KODU"
                    className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] uppercase tracking-widest transition-colors"
                  />
                  <button type="button" onClick={applyCoupon} disabled={!couponInput.trim() || couponPending}
                    className="w-full bg-[#1A1A1A] text-white font-sans text-[10px] tracking-widest uppercase px-3 py-2 hover:bg-[#C4A882] disabled:opacity-40 transition-colors">
                    {couponPending ? "..." : "Uygula"}
                  </button>
                </div>
                {couponError && <p className="font-sans text-xs text-red-500 mt-1">{couponError}</p>}
              </div>
            ) : (
              <div className="border-t border-[#E8E4DE] pt-4 flex items-center justify-between">
                <div>
                  <p className="font-sans text-[10px] uppercase text-green-600 tracking-widest">Kupon uygulandı</p>
                  <p className="font-mono text-xs font-bold text-[#1A1A1A]">{appliedCoupon}</p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-sm font-semibold text-green-600">−{couponDiscount.toLocaleString("tr-TR")} ₺</p>
                  <button type="button" onClick={removeCoupon} className="font-sans text-[10px] text-[#9A9A9A] hover:text-red-500">Kaldır</button>
                </div>
              </div>
            )}

            {/* Toplam */}
            <div className="border-t border-[#E8E4DE] pt-4 space-y-1">
              {segmentDiscount > 0 && (
                <div className="flex justify-between font-sans text-xs text-[#6B6B6B]">
                  <span>Liste fiyatı</span>
                  <span>{originalTotal.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
              {segmentDiscount > 0 && (
                <div className="flex justify-between font-sans text-xs text-[#C4A882] font-medium">
                  <span>{SEGMENT_LABELS[userSegment!]} İndirimi</span>
                  <span>−{segmentDiscount.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between font-sans text-xs text-green-600">
                  <span>Kupon ({appliedCoupon})</span>
                  <span>−{couponDiscount.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
              <div className="flex justify-between font-sans text-sm font-semibold text-[#1A1A1A] pt-1 border-t border-[#E8E4DE]">
                <span>Toplam</span>
                <span>{total.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>

            {!showForm ? (
              <button onClick={() => setShowForm(true)}
                className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors">
                Sipariş Ver
              </button>
            ) : (
              <form onSubmit={handleOrder} className="space-y-4">
                <div>
                  <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#C4A882] mb-3">Teslimat Adresi</p>
                  <div className="space-y-2">
                    {addresses.map((addr) => (
                      <label key={addr.id} className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${selected === `saved:${addr.id}` ? "border-[#C4A882] bg-[#FAF7F2]" : "border-[#E8E4DE] hover:border-[#C4A882]"}`}>
                        <input type="radio" name="adresSecim" value={`saved:${addr.id}`} checked={selected === `saved:${addr.id}`} onChange={() => setSelected(`saved:${addr.id}`)} className="mt-0.5 accent-[#C4A882] shrink-0" />
                        <div className="font-sans text-xs leading-relaxed">
                          <p className="font-semibold text-[#1A1A1A]">{addr.recipientName}</p>
                          <p className="text-[#6B6B6B]">{addr.phone}</p>
                          <p className="text-[#6B6B6B]">{addr.addressLine}</p>
                          <p className="text-[#6B6B6B]">{addr.district ? `${addr.district}, ` : ""}{addr.city}</p>
                          {addr.isDefault && <span className="inline-block mt-1 text-[8px] tracking-widest uppercase bg-[#EDE5D8] text-[#C4A882] px-1.5 py-0.5">Varsayılan</span>}
                        </div>
                      </label>
                    ))}
                    <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${selected === "new" ? "border-[#C4A882] bg-[#FAF7F2]" : "border-[#E8E4DE] hover:border-[#C4A882]"}`}>
                      <input type="radio" name="adresSecim" value="new" checked={selected === "new"} onChange={() => setSelected("new")} className="accent-[#C4A882] shrink-0" />
                      <span className="font-sans text-xs text-[#1A1A1A]">+ Yeni adres gir</span>
                    </label>
                  </div>

                  {selected === "new" && (
                    <div className="mt-3 space-y-2 border border-[#E8E4DE] p-3">
                      {([
                        { key: "recipientName", label: "Ad Soyad *",  type: "text", placeholder: "Ahmet Yılmaz" },
                        { key: "phone",          label: "Telefon *",    type: "tel",  placeholder: "05XX XXX XX XX" },
                        { key: "addressLine",    label: "Adres *",      type: "text", placeholder: "Mahalle, cadde, no, daire" },
                        { key: "city",           label: "Şehir *",      type: "text", placeholder: "İstanbul" },
                        { key: "district",       label: "İlçe",         type: "text", placeholder: "Kadıköy" },
                      ] as const).map((f) => (
                        <div key={f.key}>
                          <label className="block font-sans text-[9px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-1">{f.label}</label>
                          <input type={f.type} placeholder={f.placeholder} value={newAddr[f.key]}
                            onChange={(e) => setNewAddr((p) => ({ ...p, [f.key]: e.target.value }))}
                            className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors" />
                        </div>
                      ))}
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="w-3.5 h-3.5 accent-[#C4A882]" />
                        <span className="font-sans text-[10px] text-[#4A4A4A]">Bu adresi hesabıma kaydet</span>
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-sans text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-1">Sipariş Notu</label>
                  <input type="text" placeholder="Opsiyonel" value={note} onChange={(e) => setNote(e.target.value)}
                    className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors" />
                </div>

                {formError && <p className="font-sans text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2">{formError}</p>}

                <button type="submit" disabled={submitting}
                  className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors disabled:opacity-60">
                  {submitting ? "Gönderiliyor..." : `Siparişi Onayla — ${total.toLocaleString("tr-TR")} ₺`}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="w-full font-sans text-[10px] text-[#9A9A9A] hover:text-[#1A1A1A] py-1 transition-colors">İptal</button>
              </form>
            )}

            <Link href="/" className="block text-center font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] hover:text-[#1A1A1A] mt-4 transition-colors">
              Alışverişe Devam Et
            </Link>
          </div>
        </div>
      </div>

      {/* Cross-sell önerileri */}
      {crossSellProducts.length > 0 && (
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
                    {p.brand?.name && <p className="font-sans text-[8px] tracking-[0.2em] text-[#C4A882] mb-1">{p.brand.name}</p>}
                    <Link href={`/urunler/${p.slug}`}>
                      <h3 className="font-serif text-xs leading-snug text-[#1A1A1A] hover:text-[#C4A882] line-clamp-2 mb-2">{p.name}</h3>
                    </Link>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-sans text-sm font-semibold text-[#C4A882]">{discountedPrice.toLocaleString("tr-TR")} ₺</span>
                      <span className="font-sans text-xs text-[#9A9A9A] line-through">{p.price.toLocaleString("tr-TR")} ₺</span>
                    </div>
                    <button type="button" onClick={() => addCrossSellToCart(p)} disabled={isAdded || crossPending}
                      className="mt-auto font-sans text-[10px] tracking-widest uppercase py-2 border transition-colors disabled:opacity-50 w-full
                        border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white">
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
