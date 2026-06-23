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
interface Address {
  id: string; recipientName: string; phone: string;
  addressLine: string; city: string; district: string | null; isDefault: boolean;
}

export default function LoggedInCart({
  items,
  addresses,
}: {
  items:     CartItem[];
  addresses: Address[];
}) {
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  // "saved:<id>" veya "new"
  const defaultSel = addresses.length > 0
    ? `saved:${addresses[0].id}`
    : "new";
  const [selected, setSelected]   = useState(defaultSel);
  const [saveAddr, setSaveAddr]   = useState(true);
  const [note,     setNote]       = useState("");

  // Yeni adres form alanları
  const [newAddr, setNewAddr] = useState({
    recipientName: "", phone: "", addressLine: "", city: "", district: "",
  });

  const total = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    let delivery: {
      recipientName: string; recipientPhone: string;
      addressLine: string; city: string; district: string;
    };

    if (selected.startsWith("saved:")) {
      const addr = addresses.find((a) => a.id === selected.replace("saved:", ""));
      if (!addr) { setFormError("Adres bulunamadı."); setSubmitting(false); return; }
      delivery = {
        recipientName:  addr.recipientName,
        recipientPhone: addr.phone,
        addressLine:    addr.addressLine,
        city:           addr.city,
        district:       addr.district ?? "",
      };
    } else {
      if (!newAddr.recipientName.trim()) { setFormError("Ad Soyad gerekli."); setSubmitting(false); return; }
      if (!newAddr.phone.trim())         { setFormError("Telefon gerekli.");   setSubmitting(false); return; }
      if (!newAddr.addressLine.trim())   { setFormError("Adres gerekli.");     setSubmitting(false); return; }
      if (!newAddr.city.trim())          { setFormError("Şehir gerekli.");     setSubmitting(false); return; }
      delivery = {
        recipientName:  newAddr.recipientName,
        recipientPhone: newAddr.phone,
        addressLine:    newAddr.addressLine,
        city:           newAddr.city,
        district:       newAddr.district,
      };
    }

    const result = await placeOrder({
      recipientName:  delivery.recipientName,
      recipientPhone: delivery.recipientPhone,
      addressLine:    delivery.addressLine,
      city:           delivery.city,
      district:       delivery.district,
      note,
      saveAddress:    selected === "new" && saveAddr,
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
      {/* Ürün listesi */}
      <div className="md:col-span-2 space-y-3">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </div>

      {/* Özet + sipariş formu */}
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
            <form onSubmit={handleOrder} className="space-y-4">
              {/* ── Adres seçimi ── */}
              <div>
                <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#C4A882] mb-3">
                  Teslimat Adresi
                </p>

                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                        selected === `saved:${addr.id}`
                          ? "border-[#C4A882] bg-[#FAF7F2]"
                          : "border-[#E8E4DE] hover:border-[#C4A882]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="adresSecim"
                        value={`saved:${addr.id}`}
                        checked={selected === `saved:${addr.id}`}
                        onChange={() => setSelected(`saved:${addr.id}`)}
                        className="mt-0.5 accent-[#C4A882] shrink-0"
                      />
                      <div className="font-sans text-xs leading-relaxed">
                        <p className="font-semibold text-[#1A1A1A]">{addr.recipientName}</p>
                        <p className="text-[#6B6B6B]">{addr.phone}</p>
                        <p className="text-[#6B6B6B]">{addr.addressLine}</p>
                        <p className="text-[#6B6B6B]">
                          {addr.district ? `${addr.district}, ` : ""}{addr.city}
                        </p>
                        {addr.isDefault && (
                          <span className="inline-block mt-1 text-[8px] tracking-widest uppercase bg-[#EDE5D8] text-[#C4A882] px-1.5 py-0.5">
                            Varsayılan
                          </span>
                        )}
                      </div>
                    </label>
                  ))}

                  {/* Yeni adres seçeneği */}
                  <label
                    className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                      selected === "new"
                        ? "border-[#C4A882] bg-[#FAF7F2]"
                        : "border-[#E8E4DE] hover:border-[#C4A882]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="adresSecim"
                      value="new"
                      checked={selected === "new"}
                      onChange={() => setSelected("new")}
                      className="accent-[#C4A882] shrink-0"
                    />
                    <span className="font-sans text-xs text-[#1A1A1A]">+ Yeni adres gir</span>
                  </label>
                </div>

                {/* Yeni adres formu */}
                {selected === "new" && (
                  <div className="mt-3 space-y-2 border border-[#E8E4DE] p-3">
                    {(
                      [
                        { key: "recipientName", label: "Ad Soyad *",  type: "text", placeholder: "Ahmet Yılmaz"              },
                        { key: "phone",          label: "Telefon *",    type: "tel",  placeholder: "05XX XXX XX XX"            },
                        { key: "addressLine",    label: "Adres *",      type: "text", placeholder: "Mahalle, cadde, no, daire" },
                        { key: "city",           label: "Şehir *",      type: "text", placeholder: "İstanbul"                  },
                        { key: "district",       label: "İlçe",         type: "text", placeholder: "Kadıköy"                   },
                      ] as const
                    ).map((f) => (
                      <div key={f.key}>
                        <label className="block font-sans text-[9px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-1">
                          {f.label}
                        </label>
                        <input
                          type={f.type}
                          placeholder={f.placeholder}
                          value={newAddr[f.key]}
                          onChange={(e) => setNewAddr((p) => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors"
                        />
                      </div>
                    ))}

                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAddr}
                        onChange={(e) => setSaveAddr(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#C4A882]"
                      />
                      <span className="font-sans text-[10px] text-[#4A4A4A]">
                        Bu adresi hesabıma kaydet
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Sipariş notu */}
              <div>
                <label className="block font-sans text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-1">
                  Sipariş Notu
                </label>
                <input
                  type="text"
                  placeholder="Opsiyonel"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-[#E8E4DE] px-3 py-2 font-sans text-xs outline-none focus:border-[#C4A882] transition-colors"
                />
              </div>

              {formError && (
                <p className="font-sans text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors disabled:opacity-60"
              >
                {submitting ? "Gönderiliyor..." : "Siparişi Onayla"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-full font-sans text-[10px] text-[#9A9A9A] hover:text-[#1A1A1A] py-1 transition-colors"
              >
                İptal
              </button>
            </form>
          )}

          <Link
            href="/"
            className="block text-center font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] hover:text-[#1A1A1A] mt-4 transition-colors"
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </div>
  );
}
