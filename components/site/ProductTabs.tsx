"use client";

import { useState } from "react";

interface Props {
  description: string | null;
  scentNotes?: string | null;
}

const KULLANIM = [
  "Parfümü nabız noktalarına — bilek iç kısmı, boyun ve kulak arkası — uygulayın.",
  "Spreyi deriden 15–20 cm uzakta tutun ve ovuşturmayın; koku moleküllerini parçalar.",
  "Banyodan çıktıktan hemen sonra uygulamak kalıcılığı artırır.",
  "Katmanlı kullanım için önce losyon, ardından parfüm uygulayın.",
  "Güneş ışığından uzak, serin ve karanlık bir yerde saklayın.",
];

const TABS = ["Açıklama", "Koku Notaları", "Kullanım"];

export default function ProductTabs({ description, scentNotes }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="mt-16 border-t border-[#E8E4DE]">
      <div className="flex border-b border-[#E8E4DE]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={`font-sans text-[10px] tracking-[0.25em] uppercase px-6 py-4 transition-colors relative ${
              active === i ? "text-[#1A1A1A]" : "text-[#9A9A9A] hover:text-[#1A1A1A]"
            }`}
          >
            {tab}
            {active === i && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C4A882]" />}
          </button>
        ))}
      </div>

      <div className="py-10">
        {/* Açıklama */}
        {active === 0 && (
          <div className="max-w-2xl">
            {description ? (
              <p className="font-sans text-[#6B6B6B] leading-relaxed text-sm">{description}</p>
            ) : (
              <p className="font-sans text-[#9A9A9A] italic text-sm">Bu ürün için henüz açıklama eklenmemiştir.</p>
            )}
          </div>
        )}

        {/* Koku Notaları */}
        {active === 1 && (
          <div className="max-w-lg">
            {scentNotes ? (
              <div className="space-y-2">
                {scentNotes.split("\n").filter(Boolean).map((line, i) => (
                  <p key={i} className="font-sans text-sm text-[#1A1A1A] leading-relaxed">{line}</p>
                ))}
              </div>
            ) : (
              <p className="font-sans text-[#9A9A9A] italic text-sm">Bu ürün için koku notaları henüz eklenmemiştir.</p>
            )}
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
