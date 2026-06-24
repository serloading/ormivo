import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Ormivo — Lüks Parfüm",
  description: "Ormivo, özenle seçilmiş lüks parfüm koleksiyonu. Dünyaca ünlü parfüm evlerinden en seçkin kreasyonlar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${playfair.variable} ${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#FAFAF7] text-[#1A1A1A]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
