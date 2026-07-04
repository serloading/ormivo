"use client";

import { useState, useTransition } from "react";
import { toggleFavorite }          from "@/lib/actions/favorite";

interface Props {
  productId:        string;
  loggedIn:         boolean;
  initialFavorited: boolean;
  /** card variant: small heart overlay; default: standalone */
  variant?: "card" | "page";
}

function getLocalFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem("guest_favs") ?? "[]"); } catch { return []; }
}
function setLocalFavorites(ids: string[]) {
  try { localStorage.setItem("guest_favs", JSON.stringify(ids)); } catch {}
}

export default function FavoriteButton({ productId, loggedIn, initialFavorited, variant = "card" }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [, startTransition]       = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!loggedIn) {
      const ids = getLocalFavorites();
      if (ids.includes(productId)) {
        setLocalFavorites(ids.filter((id) => id !== productId));
        setFavorited(false);
      } else {
        setLocalFavorites([...ids, productId]);
        setFavorited(true);
      }
      return;
    }

    setFavorited((v) => !v); // optimistic
    startTransition(async () => {
      const res = await toggleFavorite(productId);
      if (res && "favorited" in res) setFavorited(Boolean(res.favorited));
    });
  }

  if (variant === "page") {
    return (
      <button
        onClick={handleClick}
        aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
        className={`flex items-center gap-2 border px-4 py-2.5 font-sans text-[11px] tracking-[0.2em] uppercase transition-colors
          ${favorited
            ? "border-[#C4A882] bg-[#FFF5ED] text-[#C4A882]"
            : "border-[#E8E4DE] text-[#6B6B6B] hover:border-[#C4A882] hover:text-[#C4A882]"}`}
      >
        <svg viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
        {favorited ? "Favorilerde" : "Favorilere Ekle"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
      className={`absolute bottom-2 right-2 z-20 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 shadow-sm group-hover:bottom-10
        ${favorited
          ? "bg-[#C4A882] text-white"
          : "bg-[#4A4A4A] text-white hover:bg-[#333] hover:text-[#C4A882]"}`}
    >
      <svg viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    </button>
  );
}
