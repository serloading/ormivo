import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Ormivo - Luks Parfum",
  description: "Ormivo, ozenle secilmis luks parfum koleksiyonu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      style={{ "--font-playfair": "Georgia, 'Times New Roman', serif", "--font-inter": "Arial, Helvetica, sans-serif" } as CSSProperties}
      className="antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#FAFAF7] text-[#1A1A1A]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}