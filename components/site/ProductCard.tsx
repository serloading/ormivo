import Link from "next/link";
import type { MockProduct } from "@/lib/mock-data";

const WA_NUMBER = "905465402113";

function whatsappLink(productName: string) {
  const msg = encodeURIComponent(
    `Merhaba, ${productName} ürününü sipariş etmek istiyorum.`
  );
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}

export default function ProductCard({ product }: { product: MockProduct }) {
  return (
    <div className="bg-white border border-[#e8ddd6] group flex flex-col">
      {/* Görsel */}
      <Link href={`/urunler/${product.slug}`}>
        <div className="aspect-square bg-[#f5f0eb] flex items-center justify-center overflow-hidden">
          <span className="text-5xl text-[#d4c5ba] group-hover:scale-110 transition-transform duration-300">
            ◈
          </span>
        </div>
      </Link>

      {/* Bilgi */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs tracking-widest text-[#8b6f5e] uppercase mb-1">
          {product.category}
        </p>
        <Link href={`/urunler/${product.slug}`}>
          <h3 className="text-sm font-medium text-[#2c1810] tracking-wide mb-2 hover:opacity-70 transition-opacity">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-[#b8a89e] leading-relaxed mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-base font-medium text-[#2c1810]">
              {product.price.toLocaleString("tr-TR")} ₺
            </span>
            {product.comparePrice && (
              <span className="text-xs text-[#b8a89e] line-through">
                {product.comparePrice.toLocaleString("tr-TR")} ₺
              </span>
            )}
          </div>

          <a
            href={whatsappLink(product.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase py-3 hover:bg-[#3d2418] transition-colors"
          >
            WhatsApp&apos;tan Sipariş Ver
          </a>
        </div>
      </div>
    </div>
  );
}
