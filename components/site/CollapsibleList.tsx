"use client";

import { useState } from "react";

interface Item { href: string; active: boolean; label: string; }

export default function CollapsibleList({ items, initialShow = 6, label = "daha" }: { items: Item[]; initialShow?: number; label?: string }) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? items : items.slice(0, initialShow);
  const hidden  = items.length - initialShow;

  return (
    <nav className="space-y-0">
      {visible.map((item) => (
        <a
          key={item.href + item.label}
          href={item.href}
          className={`block py-1.5 px-1 font-sans text-[13px] transition-colors border-l-2 pl-2 ${
            item.active
              ? "border-[#C4A882] text-[#1A1A1A] font-semibold"
              : "border-transparent text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-[#E8E4DE]"
          }`}
        >
          {item.label}
        </a>
      ))}

      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="block py-1.5 pl-2 font-sans text-[11px] text-[#C4A882] hover:text-[#8B6F4E] transition-colors tracking-wide"
        >
          + {hidden} {label} daha
        </button>
      )}

      {expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(false)}
          className="block py-1.5 pl-2 font-sans text-[11px] text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors tracking-wide"
        >
          Daha az göster
        </button>
      )}
    </nav>
  );
}
