"use client";

import { useState } from "react";
import AddToCartButton from "./AddToCartButton";

interface Props {
  productId: string;
  loggedIn:  boolean;
  inStock:   boolean;
}

export default function ProductAddToCart({ productId, loggedIn, inStock }: Props) {
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-col gap-3">
      {/* Adet seçici */}
      <div className="flex items-center gap-3">
        <span className="font-sans text-[9px] tracking-[0.3em] text-[#9A9A9A] uppercase">Adet</span>
        <div className="flex items-center border border-[#E8E4DE]">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-9 h-9 flex items-center justify-center font-sans text-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F0EA] transition-colors"
          >−</button>
          <span className="w-9 h-9 flex items-center justify-center font-sans text-sm text-[#1A1A1A] font-medium">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            className="w-9 h-9 flex items-center justify-center font-sans text-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F0EA] transition-colors"
          >+</button>
        </div>
      </div>

      {/* Sepete Ekle */}
      <div className="relative w-full h-14">
        {inStock ? (
          <AddToCartButton productId={productId} loggedIn={loggedIn} large quantity={qty} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#E8E4DE] font-sans text-[11px] tracking-[0.35em] uppercase text-[#9A9A9A]">
            Tükendi
          </div>
        )}
      </div>
    </div>
  );
}
