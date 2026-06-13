import Link from "next/link";
import Image from "next/image";

const WA_NUMBER = "905465402113";

function whatsappLink(name: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Merhaba, ${name} ürününü sipariş etmek istiyorum.`)}`;
}

type Product = {
  id: string; name: string; slug: string;
  price: number | string; comparePrice?: number | string | null;
  description?: string | null; images: string[];
  category?: { name: string } | null;
  brand?: { name: string } | null;
};

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0] ?? null;
  const discount = product.comparePrice
    ? Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)
    : null;

  return (
    <div className="group flex flex-col bg-white border border-[#e8ddd6] hover:border-[#c4a882] hover:shadow-sm transition-all duration-300">
      {/* Görsel */}
      <Link href={`/urunler/${product.slug}`} className="relative aspect-[3/4] bg-[#f5f0eb] overflow-hidden block">
        {image ? (
          <Image src={image} alt={product.name} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl text-[#d4c5ba]">◈</span>
          </div>
        )}
        {discount && (
          <span className="absolute top-3 left-3 bg-[#2c1810] text-[#f5f0eb] text-[10px] tracking-widest px-2.5 py-1 uppercase">
            -%{discount}
          </span>
        )}
      </Link>

      {/* Bilgi */}
      <div className="p-5 flex flex-col flex-1">
        {/* Marka + Kategori */}
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] tracking-widest text-[#c4a882] uppercase font-medium">
            {product.brand?.name ?? product.category?.name ?? ""}
          </p>
        </div>

        <Link href={`/urunler/${product.slug}`} className="flex-1">
          <h3 className="text-sm font-medium text-[#2c1810] tracking-wide leading-snug mb-2 hover:opacity-60 transition-opacity line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-xs text-[#a09080] leading-relaxed mb-4 line-clamp-2">{product.description}</p>
        )}

        <div className="mt-auto pt-4 border-t border-[#f0ebe6]">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-medium text-[#2c1810]">{Number(product.price).toLocaleString("tr-TR")} ₺</span>
            {product.comparePrice && (
              <span className="text-xs text-[#b8a89e] line-through">{Number(product.comparePrice).toLocaleString("tr-TR")} ₺</span>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/urunler/${product.slug}`}
              className="flex-1 text-center border border-[#d4c5ba] text-[#5c4033] text-[10px] tracking-widest uppercase py-2.5 hover:border-[#2c1810] hover:text-[#2c1810] transition-colors">
              İncele
            </Link>
            <a href={whatsappLink(product.name)} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center bg-[#2c1810] text-[#f5f0eb] text-[10px] tracking-widest uppercase py-2.5 hover:bg-[#3d2418] transition-colors">
              Sipariş
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
