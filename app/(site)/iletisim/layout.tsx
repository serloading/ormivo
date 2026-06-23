import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim — Ormivo",
  description: "Ormivo ile iletişime geçin. WhatsApp, form veya sosyal medya üzerinden bize ulaşın.",
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
