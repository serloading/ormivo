"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/admin/urunler", label: "Ürünler", icon: "◇" },
  { href: "/admin/kategoriler", label: "Kategoriler", icon: "◻" },
  { href: "/admin/musteriler", label: "Müşteriler", icon: "◉" },
  { href: "/admin/siparisler", label: "Siparişler", icon: "◎" },
  { href: "/admin/stok", label: "Stok", icon: "▦" },
  { href: "/admin/kargo", label: "Kargo", icon: "▷" },
  { href: "/admin/finans", label: "Finans", icon: "◈" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-[#2c1810] text-[#f5f0eb] flex flex-col">
      {/* Logo */}
      <div className="px-8 py-8 border-b border-[#3d2418]">
        <h1 className="text-xl font-light tracking-[0.3em] uppercase">
          Ormivo
        </h1>
        <p className="text-xs tracking-widest text-[#8b6f5e] mt-1 uppercase">
          Yönetim
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm tracking-wide transition-colors ${
                isActive
                  ? "bg-[#3d2418] text-[#f5f0eb]"
                  : "text-[#b8a89e] hover:bg-[#3d2418] hover:text-[#f5f0eb]"
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Çıkış */}
      <div className="px-4 py-6 border-t border-[#3d2418]">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-[#8b6f5e] hover:text-[#f5f0eb] transition-colors"
        >
          <span className="text-xs">⊠</span>
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
