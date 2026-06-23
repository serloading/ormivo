"use client";

import { useState } from "react";
import ScrollReveal from "@/components/site/ScrollReveal";

// metadata bu dosyada çalışmaz ("use client" var). layout.tsx veya ayrı bir server wrapper ile eklenebilir.

const WA = "905465402113";

export default function IletisimPage() {
  const [form, setForm] = useState({ ad: "", telefon: "", konu: "", mesaj: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: ileride email entegrasyonu (Resend / SendGrid) eklenecek
    console.log("Form gönderildi:", form);
    setSent(true);
  }

  return (
    <div className="bg-[#FAFAF7] min-h-screen">

      {/* ══════════════════════════════════════
          BAŞLIK HERO
      ══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 py-20"
        style={{ minHeight: 280, background: "linear-gradient(135deg, #F5F0EA 0%, #EDE5D8 60%, #E4D8C8 100%)" }}
      >
        <span
          className="pointer-events-none select-none absolute right-[-10px] bottom-[-30px] font-serif font-bold leading-none text-[#C4A882]"
          style={{ fontSize: "240px", opacity: 0.07 }}
          aria-hidden
        >İ</span>
        <span className="absolute top-6 left-6 w-8 h-8 border-t border-l border-[#C4A882]/30" />
        <span className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-[#C4A882]/30" />

        <p className="font-sans text-[10px] tracking-[0.55em] text-[#C4A882] uppercase mb-5">Ormivo</p>
        <h1 className="font-serif text-4xl md:text-5xl font-light text-[#1A1A1A] mb-4">Bize Ulaşın</h1>
        <p className="font-sans text-sm text-[#6B6B6B] max-w-sm">
          Sipariş, öneri veya her türlü sorunuz için buradayız.
        </p>
      </div>

      {/* ══════════════════════════════════════
          2 KOLON LAYOUT
      ══════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

          {/* Sol: İletişim Bilgileri */}
          <ScrollReveal direction="left">
            <div>
              <p className="font-sans text-[10px] tracking-[0.5em] text-[#C4A882] uppercase mb-8">İletişim</p>

              {/* WhatsApp büyük */}
              <a
                href={`https://wa.me/${WA}?text=${encodeURIComponent("Merhaba, bilgi almak istiyorum.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group mb-8"
              >
                <div className="w-14 h-14 bg-[#25D366] flex items-center justify-center shrink-0 group-hover:bg-[#1da851] transition-colors">
                  <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-2xl text-[#1A1A1A] group-hover:text-[#25D366] transition-colors">+90 546 540 2113</p>
                  <p className="font-sans text-xs text-[#9A9A9A] mt-1">WhatsApp üzerinden yazın</p>
                </div>
              </a>

              <div className="w-8 h-[1px] bg-[#E8E4DE] mb-8" />

              {/* Yanıt garantisi */}
              <div className="flex items-start gap-3 mb-6">
                <span className="text-[#C4A882] mt-0.5 shrink-0">◆</span>
                <div>
                  <p className="font-sans text-sm text-[#1A1A1A] font-medium mb-0.5">Hafta içi yanıt garantisi</p>
                  <p className="font-sans text-xs text-[#9A9A9A]">Pazartesi–Cuma, 09:00–18:00 arası</p>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-start gap-3 mb-6">
                <span className="text-[#C4A882] mt-0.5 shrink-0">◆</span>
                <div>
                  <a href="#" target="_blank" rel="noopener noreferrer"
                    className="font-sans text-sm text-[#1A1A1A] font-medium hover:text-[#C4A882] transition-colors">
                    @ormivo
                  </a>
                  <p className="font-sans text-xs text-[#9A9A9A]">Instagram</p>
                </div>
              </div>

              {/* Şehir */}
              <div className="flex items-start gap-3">
                <span className="text-[#C4A882] mt-0.5 shrink-0">◆</span>
                <div>
                  <p className="font-sans text-sm text-[#1A1A1A] font-medium mb-0.5">Türkiye geneli kargo</p>
                  <p className="font-sans text-xs text-[#9A9A9A]">Aynı gün kargo · Özel ambalaj</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Sağ: Form */}
          <ScrollReveal direction="right">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 border border-[#E8E4DE] bg-white">
                <span className="font-serif text-5xl text-[#C4A882] mb-5">✓</span>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mb-3">Mesajınız Alındı</h3>
                <p className="font-sans text-sm text-[#6B6B6B] max-w-xs">
                  En kısa sürede size dönüş yapacağız. WhatsApp üzerinden de ulaşabilirsiniz.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-0 bg-white border border-[#E8E4DE] p-8 md:p-10">
                <p className="font-sans text-[10px] tracking-[0.4em] text-[#C4A882] uppercase mb-8">Mesaj Gönderin</p>

                {/* Ad Soyad */}
                <div className="border-b border-[#E8E4DE] pb-4 mb-4">
                  <label className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#9A9A9A] block mb-2">Ad Soyad *</label>
                  <input
                    name="ad"
                    value={form.ad}
                    onChange={handleChange}
                    required
                    placeholder="Adınız Soyadınız"
                    className="w-full bg-transparent font-sans text-sm text-[#1A1A1A] placeholder-[#C8C4BE] outline-none py-1"
                  />
                </div>

                {/* Telefon */}
                <div className="border-b border-[#E8E4DE] pb-4 mb-4">
                  <label className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#9A9A9A] block mb-2">Telefon</label>
                  <input
                    name="telefon"
                    value={form.telefon}
                    onChange={handleChange}
                    placeholder="+90 5xx xxx xx xx"
                    className="w-full bg-transparent font-sans text-sm text-[#1A1A1A] placeholder-[#C8C4BE] outline-none py-1"
                  />
                </div>

                {/* Konu */}
                <div className="border-b border-[#E8E4DE] pb-4 mb-4">
                  <label className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#9A9A9A] block mb-2">Konu *</label>
                  <select
                    name="konu"
                    value={form.konu}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent font-sans text-sm text-[#1A1A1A] outline-none py-1 appearance-none cursor-pointer"
                  >
                    <option value="">Seçiniz...</option>
                    <option value="siparis">Sipariş vermek istiyorum</option>
                    <option value="oneri">Parfüm önerisi almak istiyorum</option>
                    <option value="bilgi">Ürün bilgisi almak istiyorum</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>

                {/* Mesaj */}
                <div className="border-b border-[#E8E4DE] pb-4 mb-8">
                  <label className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#9A9A9A] block mb-2">Mesajınız *</label>
                  <textarea
                    name="mesaj"
                    value={form.mesaj}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Mesajınızı buraya yazın..."
                    className="w-full bg-transparent font-sans text-sm text-[#1A1A1A] placeholder-[#C8C4BE] outline-none py-1 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.35em] uppercase py-4 hover:bg-[#C4A882] transition-colors duration-300"
                >
                  Gönder
                </button>

                <p className="font-sans text-[9px] text-[#B0B0B0] text-center mt-4">
                  Form şu an log&apos;a kaydedilmektedir · İleride e-posta entegrasyonu eklenecek
                </p>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>

      {/* ══════════════════════════════════════
          3. WHATSAPP BANNER
      ══════════════════════════════════════ */}
      <ScrollReveal>
        <section className="bg-[#25D366] py-14 px-6 text-center">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-white/70 mb-4">En Hızlı Yanıt</p>
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-8 font-light">
            WhatsApp&apos;tan Yazın!
          </h2>
          <p className="font-sans text-white/80 text-sm mb-8 max-w-sm mx-auto">
            Sipariş, öneri ve teslimat için anlık destek alın.
          </p>
          <a
            href={`https://wa.me/${WA}?text=${encodeURIComponent("Merhaba, bilgi almak istiyorum.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-[#1A1A1A] font-sans text-[11px] tracking-[0.3em] uppercase px-10 py-5 hover:bg-[#1A1A1A] hover:text-white transition-colors duration-300 shadow-lg"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            +90 546 540 2113
          </a>
        </section>
      </ScrollReveal>

    </div>
  );
}
