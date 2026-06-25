"use client";

import { useMemo } from "react";

export default function FomoIndicators() {
  const stockCount = useMemo(() => Math.floor(Math.random() * 4) + 2, []); // 2-5
  const viewerCount = useMemo(() => Math.floor(Math.random() * 12) + 3, []); // 3-14

  return (
    <div className="space-y-2 mb-6">
      {/* Stok uyarısı */}
      <div className="flex items-center gap-2.5 bg-[#FFF8F0] border border-[#F5DEC3] rounded-sm px-3.5 py-2.5">
        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 animate-pulse" />
        <p className="font-sans text-xs text-[#8B6F4E]">
          Stokta yalnızca <strong className="text-[#C4A882] font-semibold">{stockCount} ürün</strong> kaldı
        </p>
      </div>
      {/* İzleyici sayısı */}
      <div className="flex items-center gap-2.5 bg-[#F7F7FA] border border-[#E0DEF0] rounded-sm px-3.5 py-2.5">
        <span className="text-sm">👁</span>
        <p className="font-sans text-xs text-[#6B6B8B]">
          Şu an <strong className="text-[#7B68C8] font-semibold">{viewerCount} kişi</strong> bu ürünü inceliyor
        </p>
      </div>
    </div>
  );
}
