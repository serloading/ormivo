import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCartCount } from "@/lib/actions/cart";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import WhatsAppFloat from "@/components/site/WhatsAppFloat";

export const metadata: Metadata = {
  metadataBase: new URL("https://ormivo.com"),
  title: { default: "Ormivo — Lüks Parfüm", template: "%s | Ormivo" },
  description: "Özenle seçilmiş lüks parfümler. Her koku, bir hikaye. WhatsApp üzerinden sipariş verin.",
  keywords: ["parfüm", "lüks parfüm", "Ormivo", "kadın parfümü", "erkek parfümü", "oud", "amber"],
  openGraph: { siteName: "Ormivo", locale: "tr_TR", type: "website" },
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [brands, session, cartCount] = await Promise.all([
    prisma.brand.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    getSession(),
    getCartCount(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader
        brands={brands}
        user={session ? { name: session.name ?? null, phone: session.phone } : null}
        cartCount={cartCount}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppFloat />
    </div>
  );
}
