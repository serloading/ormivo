"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { placeOrder } from "@/lib/actions/order-site";
import { validateCoupon } from "@/lib/actions/coupon";

interface GuestItem { productId: string; qty: number; }
interface ProductInfo { id: string; name: string; price: number; images: string[] | null; brand?: string | null; }

export default function GuestCart() {
  const [items, setItems]         = useState<GuestItem[]>([]);
  const [products, setProducts]   = useState<ProductInfo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [couponInput, setCouponInput]   = useState("");
  const [couponError, setCouponError]   = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon]   = useState("");
  const [, startCouponT] = useTransition();

  useEffect(() => {
    const cart: GuestItem[] = JSON.parse(localStorage.getItem("guest_cart") ?? "[]");
    setItems(cart);
    if (cart.length === 0) { setLoading(false); return; }

    fetch("/api/products/batch", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ids: cart.map((i) => i.productId) }),
    })
      .then((r) => r.json())
      .then((data: ProductInfo[]) => setProducts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function updateQty(productId: string, delta: number) {
    setItems((prev) => {
      const next = prev.map((i) => i.productId === productId ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
      localStorage.setItem("guest_cart", JSON.stringify(next));
      window.dispatchEvent(new Event("guest-cart-updated"));
      return next;
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      localStorage.setItem("guest_cart", JSON.stringify(next));
      window.dispatchEvent(new Event("guest-cart-updated"));
      return next;
    });
  }

  async function handleOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const result = await placeOrder({
      recipientName:  fd.get("recipientName")  as string,
      recipientPhone: fd.get("recipientPhone") as string,
      addressLine:    fd.get("addressLine")    as string,
      city:           fd.get("city")           as string,
      district:       fd.get("district")       as string,
      note:           fd.get("note")           as string,
      guestItems:     items,
    });
    setSubmitting(false);
    if (result.error) { setFormError(result.error); return; }
    localStorage.removeItem("guest_cart");
    window.dispatchEvent(new Event("guest-cart-updated"));
    window.location.href = `/siparis-tamamlandi?orderNo=${result.orderNo}`;
  }

  const enriched = items.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
  }));

  const itemsTotal = enriched.reduce((s, i) => s + (i.product?.price ?? 0) * i.qty, 0);
  const total = Math.max(0, itemsTotal - couponDiscount);

  function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponError("");
    startCouponT(async () => {
      const result = await validateCoupon(couponInput, itemsTotal);
      if (!result.valid) { setCouponError(result.error ?? "Geçersiz kupon."); return; }
      setCouponDiscount(result.discount ?? 0);
      setAppliedCoupon(couponInput.toUpperCase().trim());
      setCouponInput("");
    });
  }
  function removeCoupon() { setAppliedCoupon(""); setCouponDiscount(0); setCouponInput(""); }

  if (loading) {
    return <div className="py-32 text-center font-sans text-sm text-[#9A9A9A]">Yükleniyor...</div>;
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
    <div className="grid md:grid-cols-3 gap-6">
      {/* Ürün listesi */}
      <div className="md:col-span-2 space-y-3">
        {enriched.map(({ productId, qty, product }) => (
          <div key={productId} className="bg-white border border-[#E8E4DE] p-4 flex gap-4 items-start">
            <div className="w-16 h-20 bg-[#F7F4F0] shrink-0 relative overflow-hidden">
              {product?.images?.[0] && (
                <Image src={product.images[0]} alt={product.name ?? ""} fill className="object-contain p-1" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {product?.brand && <p className="font-sans text-[9px] tracking-[0.2em] text-[#C4A882] uppercase mb-0.5">{product.brand}</p>}
              <p className="font-sans text-sm text-[#1A1A1A] leading-snug line-clamp-2">{product?.name ?? productId}</p>
              <p className="font-sans text-sm font-semibold text-[#1A1A1A] mt-1">
                {((product?.price ?? 0) * qty).toLocaleString("tr-TR")} ₺
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => updateQty(productId, -1)}
                  className="w-6 h-6 border border-[#E8E4DE] flex items-center justify-center text-[#1A1A1A] hover:border-[#C4A882] transition-colors font-sans text-sm">−</button>
                <span className="font-sans text-sm w-5 text-center">{qty}</span>
                <button onClick={() => updateQty(productId, 1)}
                  className="w-6 h-6 border border-[#E8E4DE] flex items-center justify-center text-[#1A1A1A] hover:border-[#C4A882] transition-colors font-sans text-sm">+</button>
                <button onClick={() => removeItem(productId)}
                  className="ml-auto font-sans text-[10px] text-[#9A9A9A] hover:text-red-500 transition-colors tracking-wide uppercase">
                  Kaldır
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Özet & Sipariş */}
      <div className="md:col-span-1">
        <div className="bg-white border border-[#E8E4DE] p-6 sticky top-24">
          <h2 className="font-serif text-lg text-[#1A1A1A] mb-5 pb-4 border-b border-[#E8E4DE]">Sipariş Özeti</h2>
          <div className="space-y-2 mb-5">
            {enriched.map(({ productId, qty, product }) => (
              <div key={productId} className="flex justify-between font-sans text-xs text-[#6B6B6B]">
                <span className="truncate pr-2">{product?.name ?? "Ürün"} ×{qty}</span>
                <span className="shrink-0">{((product?.price ?? 0) * qty).toLocaleString("tr-TR")} ₺</span>
              </div>
            ))}
          </div>

          {/* Kupon */}
          {!appliedCoupon ? (
            <div className="border-t border-[#E8E4DE] pt-4 mb-4">
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#9A9A9A] mb-2">İndirim Kodu</p>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                  placeholder="KUPON KODU"
                  className="flex-1 border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] uppercase tracking-widest transition-colors"
                />
                <button type="button" onClick={applyCoupon} disabled={!couponInput.trim()}
                  className="bg-[#1A1A1A] text-white font-sans text-[10px] tracking-widest uppercase px-3 py-2 hover:bg-[#C4A882] disabled:opacity-40 transition-colors">
                  Uygula
                </button>
              </div>
              {couponError && <p className="font-sans text-xs text-red-500 mt-1">{couponError}</p>}
            </div>
          ) : (
            <div className="border-t border-[#E8E4DE] pt-4 mb-4 flex items-center justify-between">
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

          <div className="border-t border-[#E8E4DE] pt-4 mb-6 space-y-1">
            {couponDiscount > 0 && (
              <div className="flex justify-between font-sans text-xs text-[#6B6B6B]">
                <span>Ara toplam</span>
                <span>{itemsTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between font-sans text-xs text-green-600">
                <span>İndirim ({appliedCoupon})</span>
                <span>−{couponDiscount.toLocaleString("tr-TR")} ₺</span>
              </div>
            )}
            <div className="flex justify-between font-sans text-sm font-semibold text-[#1A1A1A]">
              <span>Toplam</span>
              <span>{total.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>

          {!showForm ? (
            <>
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors"
              >
                Sipariş Ver
              </button>
              <p className="font-sans text-[10px] text-center text-[#9A9A9A] mt-3">
                veya{" "}
                <Link href="/giris" className="text-[#C4A882] hover:underline">giriş yapın</Link>
                {" "}/ <Link href="/kayit" className="text-[#C4A882] hover:underline">kayıt olun</Link>
              </p>
            </>
          ) : (
            <form onSubmit={handleOrder} className="space-y-3">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#C4A882] mb-3">Teslimat Bilgileri</p>
              {[
                { name: "recipientName",  label: "Ad Soyad *",       type: "text",  placeholder: "Ahmet Yılmaz" },
                { name: "recipientPhone", label: "Telefon *",         type: "tel",   placeholder: "05XX XXX XX XX" },
                { name: "addressLine",    label: "Adres *",           type: "text",  placeholder: "Mahalle, cadde, no, daire" },
                { name: "city",           label: "Şehir *",           type: "text",  placeholder: "İstanbul" },
                { name: "district",       label: "İlçe",              type: "text",  placeholder: "Kadıköy" },
                { name: "note",           label: "Sipariş Notu",      type: "text",  placeholder: "Opsiyonel" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block font-sans text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-1">{f.label}</label>
                  <input
                    name={f.name}
                    type={f.type}
                    placeholder={f.placeholder}
                    required={f.label.endsWith("*")}
                    className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors"
                  />
                </div>
              ))}
              {formError && <p className="font-sans text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2">{formError}</p>}
              <button type="submit" disabled={submitting}
                className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors disabled:opacity-60 mt-2">
                {submitting ? "Gönderiliyor..." : "Siparişi Onayla"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="w-full font-sans text-[10px] text-[#9A9A9A] hover:text-[#1A1A1A] py-1 transition-colors">
                İptal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
