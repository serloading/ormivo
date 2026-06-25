import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Markalar — Ormivo" };

export default async function MarkalarsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, logo: true },
  });

  const grouped: Record<string, typeof brands> = {};
  for (const b of brands) {
    const letter = b.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(b);
  }
  const letters = Object.keys(grouped).sort();

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="mb-8">
          <p className="font-sans text-[9px] tracking-[0.4em] text-[#C4A882] uppercase mb-1">Koleksiyon</p>
          <h1 className="font-serif text-3xl text-[#1A1A1A]">Tüm Markalar</h1>
          <p className="font-sans text-sm text-[#6B6B6B] mt-2">{brands.length} marka</p>
        </div>

        <div className="space-y-8">
          {letters.map((letter) => (
            <div key={letter}>
              <div className="flex items-center gap-4 mb-3">
                <span className="font-serif text-2xl text-[#C4A882]">{letter}</span>
                <div className="flex-1 h-px bg-[#E8E4DE]" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {grouped[letter].map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/?marka=${brand.slug}`}
                    className="bg-white border border-[#E8E4DE] hover:border-[#C4A882] hover:shadow-sm transition-all duration-200 p-4 flex flex-col items-center gap-3 group"
                  >
                    {brand.logo ? (
                      <div className="w-16 h-12 relative flex items-center justify-center">
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-12 flex items-center justify-center">
                        <span className="font-serif text-2xl text-[#C4A882] opacity-30">◈</span>
                      </div>
                    )}
                    <span className="font-sans text-xs text-[#1A1A1A] group-hover:text-[#C4A882] transition-colors text-center leading-snug">
                      {brand.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
