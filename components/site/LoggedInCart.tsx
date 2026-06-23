"use client";

import { useState } from "react";
import Link from "next/link";
import { placeOrder } from "@/lib/actions/order-site";
import CartItemRow from "./CartItemRow";

interface Product {
  id: string; name: string; price: unknown; brand?: { name: string } | null;
  images: string[]; slug: string;
}
interface CartItem { id: string; quantity: number; product: Product; }

export default function LoggedInCart({ items }: { items: CartItem[] }) {
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const total = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

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
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-3">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </div>

      <div className="md:col-span-1">
        <div className="bg-white border border-[#E8E4DE] p-6 sticky top-24">
          <h2 className="font-serif text-lg text-[#1A1A1A] mb-5 pb-4 border-b border-[#E8E4DE]">Sipariş Özeti</h2>
          <div className="space-y-2 mb-5">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between font-sans text-xs text-[#6B6B6B]">
                <span className="truncate pr-2">{i.product.name} ×{i.quantity}</span>
                <span className="shrink-0">{(Number(i.product.price) * i.quantity).toLocaleString("tr-TR")} ₺</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E8E4DE] pt-4 mb-6 flex justify-between font-sans text-sm font-semibold text-[#1A1A1A]">
            <span>Toplam</span>
            <span>{total.toLocaleString("tr-TR")} ₺</span>
          </div>

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors"
            >
              Sipariş Ver
            </button>
          ) : (
            <form onSubmit={handleOrder} className="space-y-3">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#C4A882] mb-3">Teslimat Bilgileri</p>
              {[
                { name: "recipientName",  label: "Ad Soyad *",  type: "text", placeholder: "Ahmet Yılmaz" },
                { name: "recipientPhone", label: "Telefon *",    type: "tel",  placeholder: "05XX XXX XX XX" },
                { name: "addressLine",    label: "Adres *",      type: "text", placeholder: "Mahalle, cadde, no, daire" },
                { name: "city",           label: "Şehir *",      type: "text", placeholder: "İstanbul" },
                { name: "district",       label: "İlçe",         type: "text", placeholder: "Kadıköy" },
                { name: "note",           label: "Sipariş Notu", type: "text", placeholder: "Opsiyonel" },
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

          <Link href="/" className="block text-center font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] hover:text-[#1A1A1A] mt-4 transition-colors">
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </div>
  );
}
