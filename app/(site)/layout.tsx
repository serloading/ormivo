import type { Metadata } from "next";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://ormivo.com"),
  title: { default: "Ormivo — Lüks Parfüm", template: "%s | Ormivo" },
  description: "Özenle seçilmiş lüks parfümler. Her koku, bir hikaye. WhatsApp üzerinden sipariş verin.",
  openGraph: {
    siteName: "Ormivo",
    locale: "tr_TR",
    type: "website",
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
