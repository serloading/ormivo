import Link from "next/link";
import Image from "next/image";

const WA = "905465402113";

function waLink(name: string) {
  return `https://wa.me/${WA}?text=${encodeURIComponent(`Merhaba, ${name} ürününü sipariş etmek istiyorum.`)}`;
}

type Product = {
  id: string; name: string; slug: string;
  price: number | string; comparePrice?: number | string | null;
  b2bPrice?: number | string | null;
  description?: string | null; images: string[];
  category?: { name: string } | null;
  brand?: { name: string } | null;
  isBestSeller?: boolean;
};

export default function ProductCard({ product, isLoggedIn, isB2B }: {
  product: Product;
  isLoggedIn?: boolean;
  isB2B?: boolean;
}) {
  const image = product.images?.[0] ?? null;
  const price = isB2B && product.b2bPrice ? Number(product.b2bPrice) : Number(product.price);

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
        {/* Sağ üst: En çok satan badge */}
        {product.isBestSeller && (
          <span className="absolute top-2 right-2 bg-[#1A1A1A] text-[#C4A882] font-sans text-[10px] tracking-widest px-3 py-1.5 uppercase font-semibold shadow-sm">
            ★ En Çok Satan
          </span>
        )}
      </Link>

      {/* Bilgi */}
      <div className="p-4 flex flex-col flex-1">
        {product.brand?.name ? (
          <Link href={`/urunler?marka=${encodeURIComponent(product.brand.name)}`}
            className="font-sans text-[9px] tracking-[0.2em] text-[#C4A882] uppercase mb-1 hover:text-[#8B6F4E] transition-colors block">
            {product.brand.name}
          </Link>
        ) : (
          <p className="font-sans text-[9px] tracking-[0.2em] text-[#C4A882] uppercase mb-1">
            {product.category?.name ?? ""}
          </p>
        )}

        <Link href={`/urunler/${product.slug}`}>
          <h3 className="font-serif text-sm md:text-base text-[#1A1A1A] leading-snug mb-2 line-clamp-2 hover:text-[#C4A882] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-3 border-t border-[#E8E4DE]">
          <div className="flex items-baseline gap-2 mb-3">
            {isLoggedIn === false ? (
              <Link href="/giris" className="font-sans text-xs text-[#C4A882] hover:underline">
                Fiyat için giriş yapın →
              </Link>
            ) : isB2B && product.b2bPrice ? (
              <div>
                <span className="font-sans text-base font-medium text-[#1A1A1A]">
                  {price.toLocaleString("tr-TR")} ₺
                </span>
                <span className="font-sans text-[10px] text-[#C4A882] ml-2 uppercase tracking-wide">Bayi</span>
              </div>
            ) : (
              <span className="font-sans text-base font-medium text-[#1A1A1A]">
                {price.toLocaleString("tr-TR")} ₺
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
