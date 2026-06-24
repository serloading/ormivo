"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

type NavGroup = { group: string; items: { href: string; label: string; icon: string }[] };

const navGroups: NavGroup[] = [
  {
    group: "Ürün Yönetimi",
    items: [
      { href: "/admin/urunler",     label: "Ürünler",     icon: "◇" },
      { href: "/admin/kategoriler", label: "Kategoriler", icon: "◻" },
      { href: "/admin/markalar",    label: "Markalar",    icon: "◆" },
    ],
  },
  {
    group: "Sipariş Yönetimi",
    items: [
      { href: "/admin/siparisler",                        label: "Yeni Siparişler",      icon: "◎" },
      { href: "/admin/siparisler?status=ALL",             label: "Tüm Siparişler",       icon: "≡" },
      { href: "/admin/siparisler?status=PENDING",         label: "Bekleyenler",          icon: "○" },
      { href: "/admin/siparisler?status=SHIPPED",         label: "Kargoya Verildi",      icon: "◐" },
      { href: "/admin/siparisler?status=DELIVERED",       label: "Teslim Edilenler",     icon: "●" },
      { href: "/admin/siparisler?status=CANCELLED",       label: "İptal Edilenler",      icon: "✕" },
    ],
  },
  {
    group: "CRM",
    items: [
      { href: "/admin/musteriler", label: "Müşteriler", icon: "◑" },
    ],
  },
  {
    group: "Finans Yönetimi",
    items: [
      { href: "/admin/rapor",       label: "Rapor",          icon: "◉" },
      { href: "/admin/borc-alacak", label: "Borç / Alacak",  icon: "₺" },
    ],
  },
];

function NavLink({ href, label, icon, pathname, onClick }: { href: string; label: string; icon: string; pathname: string; onClick?: () => void }) {
  // Active: exact match or pathname starts with base href (ignoring query string)
  const base = href.split("?")[0];
  const active = pathname === base && !href.includes("?")
    ? true
    : href.includes("?") && pathname === base
      ? false  // query-filtered links never auto-active; keep simple
      : pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-sm text-sm tracking-wide transition-colors ${active ? "bg-[#3d2418] text-[#f5f0eb]" : "text-[#b8a89e] hover:bg-[#3d2418] hover:text-[#f5f0eb]"}`}
    >
      <span className="text-xs w-4">{icon}</span>
      {label}
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <nav className="flex-1 px-4 py-6 space-y-5 overflow-y-auto">
        {/* Dashboard */}
        <NavLink href="/admin/dashboard" label="Dashboard" icon="◈" pathname={pathname} onClick={() => setMobileOpen(false)} />

        {/* Grouped nav */}
        {navGroups.map((group) => (
          <div key={group.group}>
            <p className="px-4 mb-1 text-[9px] tracking-[0.3em] uppercase text-[#5c4033] font-medium">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} {...item} pathname={pathname} onClick={() => setMobileOpen(false)} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-4 py-6 border-t border-[#3d2418]">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-[#8b6f5e] hover:text-[#f5f0eb] transition-colors"
        >
          <span className="text-xs">⊠</span>
          Çıkış Yap
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 min-h-screen bg-[#2c1810] text-[#f5f0eb] flex-col flex-shrink-0">
        <div className="px-8 py-8 border-b border-[#3d2418]">
          <h1 className="text-xl font-light tracking-[0.3em] uppercase">Ormivo</h1>
          <p className="text-xs tracking-widest text-[#8b6f5e] mt-1 uppercase">Yönetim</p>
        </div>
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#2c1810] text-[#f5f0eb] flex items-center justify-between px-5 py-4">
        <span className="text-lg font-light tracking-[0.3em] uppercase">Ormivo</span>
        <button onClick={() => setMobileOpen((v) => !v)} className="flex flex-col gap-1.5 p-1" aria-label="Menü">
          <span className={`block w-5 h-px bg-[#f5f0eb] transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-px bg-[#f5f0eb] transition-all ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-px bg-[#f5f0eb] transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-[#2c1810] flex flex-col">
            <div className="px-8 py-8 border-b border-[#3d2418] mt-14">
              <p className="text-xs tracking-widest text-[#8b6f5e] uppercase">Menü</p>
            </div>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
