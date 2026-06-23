"use client";

import { useState } from "react";

interface Props {
  description: string | null;
}

const NOTES = {
  ust:  ["Bergamot", "Limon", "Pembe Biber"],
  orta: ["Gül", "Yasemin", "Iris"],
  alt:  ["Sandal Ağacı", "Misk", "Amber"],
};

const KULLANIM = [
  "Parfümü nabız noktalarına — bilek iç kısmı, boyun ve kulak arkası — uygulayın.",
  "Spreyi deriden 15–20 cm uzakta tutun ve ovuşturmayın; koku moleküllerini parçalar.",
  "Banyodan çıktıktan hemen sonra uygulamak kalıcılığı artırır.",
  "Katmanlı kullanım için önce losyon, ardından parfüm uygulayın.",
  "Güneş ışığından uzak, serin ve karanlık bir yerde saklayın.",
];

const TABS = ["Açıklama", "Koku Notaları", "Kullanım"];

export default function ProductTabs({ description }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="mt-16 border-t border-[#E8E4DE]">
      {/* Tab başlıkları */}
      <div className="flex border-b border-[#E8E4DE]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={`font-sans text-[10px] tracking-[0.25em] uppercase px-6 py-4 transition-colors relative ${
              active === i
                ? "text-[#1A1A1A]"
                : "text-[#9A9A9A] hover:text-[#1A1A1A]"
            }`}
          >
            {tab}
            {active === i && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C4A882]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab içerikleri */}
      <div className="py-10">

        {/* Açıklama */}
        {active === 0 && (
          <div className="max-w-2xl">
            {description ? (
              <p className="font-sans text-[#6B6B6B] leading-relaxed text-sm">
                {description}
              </p>
            ) : (
              <p className="font-sans text-[#9A9A9A] italic text-sm">
                Bu ürün için henüz açıklama eklenmemiştir.
              </p>
            )}
          </div>
        )}

        {/* Koku Notaları */}
        {active === 1 && (
          <div className="max-w-lg">
            {/* Piramit görünümü */}
            <div className="space-y-4">
              {[
                { label: "Üst Nota", notes: NOTES.ust,  width: "w-1/2",  bg: "bg-[#E8E4DE]", desc: "İlk temas — 15 dakika" },
                { label: "Orta Nota", notes: NOTES.orta, width: "w-3/4",  bg: "bg-[#D4C8BC]", desc: "Kalp — 2-4 saat" },
                { label: "Alt Nota",  notes: NOTES.alt,  width: "w-full", bg: "bg-[#C4A882]/40", desc: "Dip — 6-8 saat" },
              ].map(({ label, notes, width, bg, desc }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className={`${width} ${bg} px-4 py-3`}>
                    <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#8B6F4E] mb-1">{label}</p>
                    <p className="font-sans text-sm text-[#1A1A1A]">{notes.join(" · ")}</p>
                  </div>
                  <p className="font-sans text-[10px] text-[#B0B0B0] shrink-0">{desc}</p>
                </div>
              ))}
            </div>
            <p className="font-sans text-[10px] text-[#B0B0B0] mt-6 italic">
              * Koku notaları örnek içerik olup ürüne göre farklılık gösterebilir.
            </p>
          </div>
        )}

        {/* Kullanım */}
        {active === 2 && (
          <div className="max-w-2xl">
            <ul className="space-y-4">
              {KULLANIM.map((tip, i) => (
                <li key={i} className="flex gap-4">
                  <span className="font-serif text-[#C4A882] text-lg leading-none shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-sans text-sm text-[#6B6B6B] leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
