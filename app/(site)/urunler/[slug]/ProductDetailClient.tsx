"use client";

import { useState } from "react";

const SECTIONS = [
  {
    title: "Nasıl Uygulanır?",
    content: [
      "Parfümü nabız noktalarına — bilek iç kısmı, boyun ve kulak arkası — uygulayın. Bu bölgelerdeki ısı, kokuyu aktive ederek yayılmasını sağlar.",
      "Spreyi deriden 15–20 cm uzakta tutarak hafif bir sis oluşturun. Parfümün üzerine ovuşturmayın; bu koku moleküllerini parçalar.",
      "Sabah banyodan çıktıktan hemen sonra uygulamak, nemin kokuyu cilde tutmasına yardımcı olur ve kalıcılığı artırır.",
      "Katmanlı kullanım için önce vücut kremi, ardından parfüm uygulayın; böylece koku çok daha uzun süre kalır.",
    ],
  },
  {
    title: "Koku Karakteri & Öneriler",
    content: [
      "Lüks parfümler genellikle üç kat koku notası içerir: ilk patlayan baş notalar, saatlerce kalan kalp notaları ve günboyu iz bırakan dip notalar.",
      "Gündüz kullanımı için hafif, ferah ve çiçeksi kreasyonlar; gece için yoğun, odunsu ve egzotik notalar tercih edilebilir.",
      "Aynı parfüm farklı kişilerde farklı kokar — cildinizin kendi kokusu ve pH değeri, parfümün size özel bir imza oluşturmasını sağlar.",
      "Mevsime göre seçim yaparken yaz ayları için aquatik ve sitrus; kış için amber, oud ve musks daha uyumlu sonuç verir.",
    ],
  },
  {
    title: "Saklama & Bakım",
    content: [
      "Parfümünüzü doğrudan güneş ışığından uzak, serin ve karanlık bir yerde saklayın. Işık ve ısı, koku bileşenlerini bozabilir.",
      "Orijinal kutusunda saklamak parfümün ömrünü uzatır. Parfüm dolabı ya da çekmece ideal depolama ortamıdır.",
      "Banyo gibi nemli ve sıcaklık değişiminin sık yaşandığı ortamlardan kaçının.",
      "Şişeyi güzelce kapaldığınızdan emin olun; açık kalan parfüm oksitlenerek zamanla koku profilini kaybeder.",
    ],
  },
  {
    title: "Sıkça Sorulan Sorular",
    content: [
      "Ürünler orijinal mi? Evet, tüm ürünler resmi distribütörlerden, orijinallik sertifikasıyla temin edilmektedir.",
      "Kargo ne kadar sürer? Sipariş onayından sonra genellikle 1–3 iş günü içinde teslim edilir.",
      "Sipariş nasıl verilir? WhatsApp üzerinden ürün adını bildirmeniz yeterlidir. Ödeme ve adres bilgisi mesajla alınır.",
      "İade kabul ediyor musunuz? Ambalajı açılmamış ve kullanılmamış ürünler için 14 gün içinde iade talebinde bulunabilirsiniz.",
    ],
  },
];

export default function ProductDetailClient() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="border-t border-[#e8ddd6]">
      {SECTIONS.map((s, i) => (
        <div key={i} className="border-b border-[#e8ddd6]">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-left group"
          >
            <span className="text-xs tracking-widest text-[#2c1810] uppercase">{s.title}</span>
            <span className={`text-[#8b6f5e] text-xs transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
          {open === i && (
            <ul className="pb-5 space-y-2.5">
              {s.content.map((line, j) => (
                <li key={j} className="flex gap-3 text-sm text-[#5c4033] leading-relaxed font-light">
                  <span className="text-[#c4a882] mt-0.5 shrink-0">—</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
