"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  urunler: "Ürünler",
  kategoriler: "Kategoriler",
  musteriler: "Müşteriler",
  siparisler: "Siparişler",
  stok: "Stok",
  kargo: "Kargo",
  finans: "Finans",
  yeni: "Yeni",
  duzenle: "Düzenle",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length <= 2) return null; // dashboard gibi tek seviyeli sayfalarda gösterme

  const crumbs = parts.map((part, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const label = LABELS[part] ?? part;
    const isLast = i === parts.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1.5 text-xs text-[#b8a89e] mb-6">
      {crumbs.map((c) =>
        c.isLast ? (
          <span key={c.href} className="text-[#5c4033]">{c.label}</span>
        ) : (
          <span key={c.href} className="flex items-center gap-1.5">
            <Link href={c.href} className="hover:text-[#5c4033] transition-colors">{c.label}</Link>
            <span>/</span>
          </span>
        )
      )}
    </nav>
  );
}
