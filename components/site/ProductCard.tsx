import Link from "next/link";
import Image from "next/image";

const WA = "905465402113";

function waLink(name: string) {
  return `https://wa.me/${WA}?text=${encodeURIComponent(`Merhaba, ${name} ürününü sipariş etmek istiyorum.`)}`;
}

type Product = {
  id: string; name: string; slug: string;
  price: number | string; comparePrice?: number | string | null;
  description?: string | null; images: string[];
  category?: { name: string } | null;
  brand?: { name: string } | null;
  isBestSeller?: boolean;
};

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0] ?? null;
  const price = Number(product.price);
  const compare = product.comparePrice ? Number(product.comparePrice) : null;

  return (
    <article className="group flex flex-col bg-white border border-[#E8E4DE] hover:border-[#C4A882] hover:shadow-lg transition-all duration-500">
      {/* Görsel */}
      <Link href={`/urunler/${product.slug}`} className="relative bg-[#F5F0EA] overflow-hidden block" style={{ aspectRatio: "3/4" }}>
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-5xl text-[#C4A882] opacity-30">◈</span>
          </div>
        )}
        {/* Sol üst: %20 indirim badge */}
        {compare && (
          <span className="absolute top-3 left-3 bg-[#C4A882] text-white font-sans text-[9px] tracking-widest px-2.5 py-1 uppercase font-medium">
            %20 İndirim
          </span>
        )}
        {/* Sağ üst: En çok satan badge */}
        {product.isBestSeller && (
          <span className="absolute top-3 right-3 bg-[#1A1A1A] text-[#C4A882] font-sans text-[9px] tracking-widest px-2.5 py-1 uppercase font-medium">
            ★ En Çok Satan
          </span>
        )}
      </Link>

      {/* Bilgi */}
      <div className="p-4 flex flex-col flex-1">
        <p className="font-sans text-[9px] tracking-[0.2em] text-[#C4A882] uppercase mb-1">
          {product.brand?.name ?? product.category?.name ?? ""}
        </p>

        <Link href={`/urunler/${product.slug}`}>
          <h3 className="font-serif text-sm md:text-base text-[#1A1A1A] leading-snug mb-2 line-clamp-2 hover:text-[#C4A882] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-3 border-t border-[#E8E4DE]">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-sans text-base font-medium text-[#1A1A1A]">
              {price.toLocaleString("tr-TR")} ₺
            </span>
            {compare && (
              <span className="font-sans text-xs text-[#9A9A9A] line-through">
                {compare.toLocaleString("tr-TR")} ₺
              </span>
            )}
          </div>
          {product.isBestSeller && (
            <p className="font-sans text-[9px] tracking-widest text-[#C4A882] uppercase mb-2">★ En Çok Tercih Edilenler</p>
          )}

          <div className="flex gap-2">
            <Link
              href={`/urunler/${product.slug}`}
              className="flex-1 text-center border border-[#E8E4DE] text-[#6B6B6B] font-sans text-[9px] tracking-widest uppercase py-2.5 hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
            >
              İncele
            </Link>
            <a
              href={waLink(product.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-[#1A1A1A] text-white font-sans text-[9px] tracking-widest uppercase py-2.5 hover:bg-[#C4A882] transition-colors duration-300"
            >
              Sipariş
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
