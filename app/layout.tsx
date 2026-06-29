import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Ormivo â€” LÃ¼ks ParfÃ¼m",
  description: "Ormivo, Ã¶zenle seÃ§ilmiÅŸ lÃ¼ks parfÃ¼m koleksiyonu. DÃ¼nyaca Ã¼nlÃ¼ parfÃ¼m evlerinden en seÃ§kin kreasyonlar.",
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
