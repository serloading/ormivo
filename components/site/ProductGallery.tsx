"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="bg-[#F5F0EA] border border-[#E8E4DE] flex items-center justify-center" style={{ aspectRatio: "4/5" }}>
        <span className="font-serif text-8xl text-[#C4A882] opacity-20">◈</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Ana görsel */}
      <div
        className="relative bg-[#F5F0EA] border border-[#E8E4DE] overflow-hidden"
        style={{ aspectRatio: "4/5" }}
      >
        <Image
          key={active}
          src={images[active]}
          alt={name}
          fill
          className="object-contain p-8"
          priority
          sizes="(max-width:768px) 100vw, 50vw"
        />
        {/* Köşe aksanlar */}
        <span className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#C4A882]/30 pointer-events-none" />
        <span className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#C4A882]/30 pointer-events-none" />
      </div>

      {/* Thumbnail'lar */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.slice(0, 5).map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative shrink-0 bg-[#F5F0EA] border transition-colors duration-200 overflow-hidden ${
                active === i ? "border-[#C4A882]" : "border-[#E8E4DE] hover:border-[#C4A882]/50"
              }`}
              style={{ width: 72, height: 72 }}
              aria-label={`Görsel ${i + 1}`}
            >
              <Image src={img} alt={`${name} ${i + 1}`} fill className="object-contain p-2" sizes="72px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
