"use client";

import { useState } from "react";

const SECTIONS = [
  {
    title: "Nasıl Uygulanır?",
    content: [
      "Parfümü nabız noktalarına — bilek iç kısmı, boyun ve kulak arkası — uygulayın. Bu bölgelerdeki ısı kokuyu aktive eder.",
      "Spreyi deriden 15–20 cm uzakta tutun. Parfümün üzerine ovuşturmayın; bu koku moleküllerini parçalar.",
      "Banyodan çıktıktan hemen sonra uygulamak, nem kokuyu cilde tutarak kalıcılığı artırır.",
      "Katmanlı kullanım için önce losyon, ardından parfüm uygulayın.",
    ],
  },
  {
    title: "Koku Karakteri & Öneriler",
    content: [
      "Lüks parfümler üç kat nota içerir: patlayan baş notalar, saatlerce süren kalp notaları ve tüm gün iz bırakan dip notalar.",
      "Gündüz için ferah ve çiçeksi; gece için yoğun, odunsu ve egzotik notalar tercih edilebilir.",
      "Aynı parfüm farklı kişilerde farklı kokar — cildinizin pH değeri parfümü sizin imzanıza dönüştürür.",
      "Yaz için aquatik ve sitrus; kış için amber, oud ve musks notaları daha uyumlu sonuç verir.",
    ],
  },
  {
    title: "Saklama & Bakım",
    content: [
      "Parfümünüzü güneş ışığından uzak, serin ve karanlık bir yerde saklayın.",
      "Orijinal kutusunda saklamak parfümün ömrünü önemli ölçüde uzatır.",
      "Banyo gibi nem ve ısı değişiminin sık olduğu ortamlardan kaçının.",
      "Şişeyi her kullanımdan sonra sıkıca kapatın; oksidasyonu önler.",
    ],
  },
  {
    title: "Sıkça Sorulan Sorular",
    content: [
      "Ürünler orijinal mi? Evet, tüm ürünler resmi distribütörlerden orijinallik sertifikasıyla temin edilir.",
      "Kargo ne kadar sürer? Sipariş onayından sonra 1–3 iş günü içinde teslim edilir.",
"İade mümkün mü? Ambalajı açılmamış ürünler için 14 gün içinde iade talebinde bulunabilirsiniz.",
    ],
  },
];

export default function ProductDetailClient() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="border-t border-[#E8E4DE]">
      {SECTIONS.map((s, i) => (
        <div key={i} className="border-b border-[#E8E4DE]">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-left"
          >
            <span className="font-sans text-[11px] tracking-[0.2em] text-[#1A1A1A] uppercase">
              {s.title}
            </span>
            <span className={`text-[#C4A882] text-sm transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}>
              +
            </span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-[500px] pb-5" : "max-h-0"}`}>
            <ul className="space-y-3">
              {s.content.map((line, j) => (
                <li key={j} className="flex gap-3 font-sans text-sm text-[#6B6B6B] leading-relaxed">
                  <span className="text-[#C4A882] shrink-0 mt-0.5">—</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
