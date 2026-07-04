"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { placeOrder } from "@/lib/actions/order-site";
import { validateCoupon } from "@/lib/actions/coupon";
import { calcDisplayPrice, SEGMENT_LABELS, SEGMENT_COLORS, type SegmentPricingSettings } from "@/lib/segment";
import { TURKEY_CITIES, CITY_NAMES } from "@/lib/data/turkey-cities";

interface Product {
  id: string; name: string; price: unknown; costPrice?: unknown;
  images: string[]; slug: string;
}
interface CartItem { id: string; quantity: number; customPrice?: unknown; product: Product; }
interface Address {
  id: string; recipientName: string; phone: string;
  addressLine: string; city: string; district: string | null; isDefault: boolean;
}

export default function CheckoutClient({
  items,
  addresses,
  userSegment = null,
  isB2B = false,
  b2bMarkup = null,
  segmentSettings,
  userName = "",
  userPhone = "",
}: {
  items: CartItem[];
  addresses: Address[];
  userSegment?: string | null;
  isB2B?: boolean;
  b2bMarkup?: number | null;
  segmentSettings?: SegmentPricingSettings;
  userName?: string;
  userPhone?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const defaultSel = addresses.length > 0 ? `saved:${addresses[0].id}` : "new";
  const [selected, setSelected] = useState(defaultSel);
  const [saveAddr, setSaveAddr] = useState(true);
  const [note, setNote] = useState("");
  const [newAddr, setNewAddr] = useState({ recipientName: "", phone: "", addressLine: "", city: "", district: "" });

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponPending, startCouponT] = useTransition();

  const [paymentMethod, setPaymentMethod] = useState<"HAVALE" | "KART">("HAVALE");
  const [deliveryMethod, setDeliveryMethod] = useState<"CARGO" | "STORE">("CARGO");

  const originalTotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const segmentTotal  = items.reduce((s, i) => {
    if (i.customPrice != null) return s + Number(i.customPrice) * i.quantity;
    const cp = i.product.costPrice != null ? Number(i.product.costPrice) : null;
    const { displayPrice } = calcDisplayPrice(Number(i.product.price), cp, isB2B, b2bMarkup, userSegment, segmentSettings);
    return s + displayPrice * i.quantity;
  }, 0);
  const segmentDiscount = Math.round(originalTotal - segmentTotal);
  const total = Math.max(0, segmentTotal - couponDiscount);

  function applyCoupon() {
    setCouponError("");
    startCouponT(async () => {
      const result = await validateCoupon(couponInput, segmentTotal);
      if (!result.valid) { setCouponError(result.error ?? "Geçersiz kupon."); return; }
      setCouponDiscount(result.discount ?? 0);
      setAppliedCoupon(couponInput.toUpperCase().trim());
      setCouponInput("");
    });
  }

  function removeCoupon() { setCouponDiscount(0); setAppliedCoupon(""); setCouponError(""); }

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    let delivery: { recipientName: string; recipientPhone: string; addressLine: string; city: string; district: string };

    if (deliveryMethod === "STORE") {
      delivery = { recipientName: userName || "Mağaza Teslim", recipientPhone: userPhone || "—", addressLine: "Mağazadan Teslim", city: "Mağaza", district: "" };
    } else if (selected.startsWith("saved:")) {
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
      paymentMethod,
      deliveryMethod,
    });

    setSubmitting(false);
    if (result.error) { setFormError(result.error); return; }
    if (paymentMethod === "KART") {
      window.location.href = `/siparis-odeme/${result.orderNo}`;
    } else {
      window.location.href = `/siparis-tamamlandi?orderNo=${result.orderNo}`;
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Sol: Form */}
      <div className="md:col-span-2">
        <form onSubmit={handleOrder} className="space-y-6">

          {/* Teslimat yöntemi */}
          <div className="bg-white border border-[#E8E4DE] p-6">
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#C4A882] mb-3">Teslimat Yöntemi</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "CARGO", label: "Adrese Teslim", desc: "Kargo ile gönderilir" },
                { value: "STORE", label: "Mağaza Teslim", desc: "Mağazadan teslim alın" },
              ] as const).map((opt) => (
                <label key={opt.value}
                  className={`flex flex-col gap-1 p-3 border cursor-pointer transition-colors ${deliveryMethod === opt.value ? "border-[#C4A882] bg-[#FAF7F2]" : "border-[#E8E4DE] hover:border-[#C4A882]"}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="deliveryMethod" value={opt.value} checked={deliveryMethod === opt.value}
                      onChange={() => setDeliveryMethod(opt.value)} className="accent-[#C4A882] shrink-0" />
                    <span className="font-sans text-xs font-semibold text-[#1A1A1A]">{opt.label}</span>
                  </div>
                  <p className="font-sans text-[10px] text-[#9A9A9A] pl-5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Teslimat adresi — sadece CARGO'da göster */}
          {deliveryMethod === "CARGO" && (
            <div className="bg-white border border-[#E8E4DE] p-6">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#C4A882] mb-3">Teslimat Adresi</p>
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${selected === `saved:${addr.id}` ? "border-[#C4A882] bg-[#FAF7F2]" : "border-[#E8E4DE] hover:border-[#C4A882]"}`}>
                    <input type="radio" name="adresSecim" value={`saved:${addr.id}`} checked={selected === `saved:${addr.id}`}
                      onChange={() => setSelected(`saved:${addr.id}`)} className="mt-0.5 accent-[#C4A882] shrink-0" />
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
                  <input type="radio" name="adresSecim" value="new" checked={selected === "new"}
                    onChange={() => setSelected("new")} className="accent-[#C4A882] shrink-0" />
                  <span className="font-sans text-xs text-[#1A1A1A]">+ Yeni adres gir</span>
                </label>
              </div>

              {selected === "new" && (
                <div className="mt-3 space-y-2 border border-[#E8E4DE] p-3">
                  {([
                    { key: "recipientName", label: "Ad Soyad *", type: "text", placeholder: "Ahmet Yılmaz" },
                    { key: "phone",         label: "Telefon *",  type: "tel",  placeholder: "05XX XXX XX XX" },
                    { key: "addressLine",   label: "Adres *",    type: "text", placeholder: "Mahalle, cadde, no, daire" },
                  ] as const).map((f) => (
                    <div key={f.key}>
                      <label className="block font-sans text-[9px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-1">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={newAddr[f.key]}
                        onChange={(e) => setNewAddr((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors" />
                    </div>
                  ))}
                  <div>
                    <label className="block font-sans text-[9px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-1">Şehir *</label>
                    <select value={newAddr.city}
                      onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value, district: "" }))}
                      className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors">
                      <option value="">Şehir seçin…</option>
                      {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-sans text-[9px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-1">İlçe</label>
                    {newAddr.city && TURKEY_CITIES[newAddr.city]?.length > 0 ? (
                      <select value={newAddr.district}
                        onChange={(e) => setNewAddr((p) => ({ ...p, district: e.target.value }))}
                        className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors">
                        <option value="">İlçe seçin (opsiyonel)</option>
                        {TURKEY_CITIES[newAddr.city].map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <input type="text" placeholder={newAddr.city === "Yurt Dışı" ? "Bölge / Şehir" : "Kadıköy"} value={newAddr.district}
                        onChange={(e) => setNewAddr((p) => ({ ...p, district: e.target.value }))}
                        className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors" />
                    )}
                  </div>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="w-3.5 h-3.5 accent-[#C4A882]" />
                    <span className="font-sans text-[10px] text-[#4A4A4A]">Bu adresi hesabıma kaydet</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Sipariş notu */}
          <div className="bg-white border border-[#E8E4DE] p-6">
            <label className="block font-sans text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-2">Sipariş Notu (Opsiyonel)</label>
            <input type="text" placeholder="Kargoya özel not..." value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors" />
          </div>

          {/* Ödeme yöntemi */}
          <div className="bg-white border border-[#E8E4DE] p-6">
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#C4A882] mb-3">Ödeme Yöntemi</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "HAVALE", label: "Havale / EFT",       desc: "Banka havalesi ile ödeme" },
                { value: "KART",   label: "Kredi / Banka Kartı", desc: "Güvenli ödeme sayfasına yönlendirilirsiniz" },
              ] as const).map((opt) => (
                <label key={opt.value}
                  className={`flex flex-col gap-1 p-3 border cursor-pointer transition-colors ${paymentMethod === opt.value ? "border-[#C4A882] bg-[#FAF7F2]" : "border-[#E8E4DE] hover:border-[#C4A882]"}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="paymentMethod" value={opt.value} checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)} className="accent-[#C4A882] shrink-0" />
                    <span className="font-sans text-xs font-semibold text-[#1A1A1A]">{opt.label}</span>
                  </div>
                  <p className="font-sans text-[10px] text-[#9A9A9A] pl-5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {formError && <p className="font-sans text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2">{formError}</p>}

          <button type="submit" disabled={submitting}
            className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-4 hover:bg-[#C4A882] transition-colors disabled:opacity-60">
            {submitting ? "Gönderiliyor..." : `Siparişi Onayla — ${total.toLocaleString("tr-TR")} ₺`}
          </button>
        </form>
      </div>

      {/* Sağ: Sipariş özeti */}
      <div className="md:col-span-1">
        <div className="bg-white border border-[#E8E4DE] p-6 sticky top-24 space-y-5">
          <h2 className="font-serif text-lg text-[#1A1A1A] pb-4 border-b border-[#E8E4DE]">Sepetiniz</h2>

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

          {/* Kupon — bayiler hariç */}
          {!isB2B && (!appliedCoupon ? (
            <div className="border-t border-[#E8E4DE] pt-4">
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] mb-2">İndirim Kodu</p>
              <div className="flex flex-col gap-2">
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                  placeholder="KUPON KODU"
                  className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] uppercase tracking-widest transition-colors" />
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
          ))}

          <div className="border-t border-[#E8E4DE] pt-4 space-y-1">
            {segmentDiscount > 0 && (
              <div className="flex justify-between font-sans text-xs text-[#6B6B6B]">
                <span>Liste fiyatı</span>
                <span>{originalTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
            )}
            {segmentDiscount > 0 && (
              <div className="flex justify-between font-sans text-xs text-[#C4A882] font-medium">
                <span>{isB2B ? "Bayi Fiyatı" : (userSegment && SEGMENT_LABELS[userSegment] ? SEGMENT_LABELS[userSegment] + " İndirimi" : "Özel İndirim")}</span>
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

          <Link href="/sepet" className="block text-center font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors">
            ← Sepete Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
