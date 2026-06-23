"use client";

import { useTransition, useState } from "react";
import { addToCart } from "@/lib/actions/cart";
import { useRouter } from "next/navigation";

interface Props {
  productId: string;
  loggedIn:  boolean;
  large?:    boolean;
}

export default function AddToCartButton({ productId, loggedIn, large = false }: Props) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded]          = useState(false);
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!loggedIn) {
      window.location.href = "/giris";
      return;
    }

    startTransition(async () => {
      const result = await addToCart(productId);
      if (result?.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
        router.refresh();
      }
    });
  }

  if (large) {
    return (
      <button
        onClick={handleClick}
        disabled={pending}
        className={`w-full h-full flex items-center justify-center gap-2 font-sans text-[11px] tracking-[0.35em] uppercase transition-colors duration-300
          ${added ? "bg-[#25D366] text-white" : "bg-[#1A1A1A] text-white hover:bg-[#C4A882]"}
          disabled:opacity-70`}
      >
        {added ? (
          <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Sepete Eklendi!</>
        ) : pending ? "Ekleniyor..." : (
          <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>{loggedIn ? "Sepete Ekle" : "Giriş Yap & Ekle"}</>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`absolute inset-x-0 bottom-0 py-2 flex items-center justify-center gap-1.5 font-sans text-[8px] tracking-[0.2em] uppercase transition-all duration-300 ease-out z-10
        translate-y-full group-hover:translate-y-0
        ${added
          ? "bg-[#25D366] text-white"
          : "bg-[#1A1A1A] text-white hover:bg-[#C4A882]"
        }
        disabled:opacity-70`}
    >
      {added ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Eklendi!
        </>
      ) : pending ? (
        "Ekleniyor..."
      ) : loggedIn ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          Sepete Ekle
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25V9m-3.75 0h13.5M5.625 9l.75 10.5h12.75L18.375 9" />
          </svg>
          Giriş Yap & Ekle
        </>
      )}
    </button>
  );
}
