import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductDetailClient from "./ProductDetailClient";
import ProductCard from "@/components/site/ProductCard";

const WA = "905465402113";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ where: { deletedAt: null }, select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.product.findFirst({ where: { slug, deletedAt: null } });
  if (!p) return {};
  return { title: `${p.name} — Ormivo` };
}

export default async function UrunDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    include: { category: true, brand: true },
  });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: {
      deletedAt: null, isActive: true, id: { not: product.id },
      OR: [
        ...(product.brandId ? [{ brandId: product.brandId }] : []),
        ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
      ],
    },
    include: { category: true, brand: true },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const price = Number(product.price);
  const compare = product.comparePrice ? Number(product.comparePrice) : null;
  const discount = compare ? Math.round((1 - price / compare) * 100) : null;
  const waMsg = encodeURIComponent(`Merhaba, ${product.name} ürününü sipariş etmek istiyorum.`);

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-sans text-xs text-[#9A9A9A] mb-12">
          <Link href="/" className="hover:text-[#1A1A1A] transition-colors">Ana Sayfa</Link>
          <span className="text-[#E8E4DE]">/</span>
          <Link href="/urunler" className="hover:text-[#1A1A1A] transition-colors">Koleksiyon</Link>
          {product.brand && (
            <>
              <span className="text-[#E8E4DE]">/</span>
              <Link href={`/urunler?marka=${product.brand.slug}`} className="hover:text-[#1A1A1A] transition-colors">
                {product.brand.name}
              </Link>
            </>
          )}
          <span className="text-[#E8E4DE]">/</span>
          <span className="text-[#6B6B6B] truncate max-w-[140px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

          {/* Sol: Görsel */}
          <div>
            <div className="bg-[#F5F0EA] border border-[#E8E4DE] relative overflow-hidden" style={{ aspectRatio: "1/1" }}>
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-8xl text-[#C4A882] opacity-20">◈</span>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {product.images.slice(1, 5).map((img, i) => (
                  <div key={i} className="bg-[#F5F0EA] border border-[#E8E4DE] relative overflow-hidden hover:border-[#C4A882] transition-colors cursor-pointer" style={{ aspectRatio: "1/1" }}>
                    <Image src={img} alt={`${product.name} ${i + 2}`} fill className="object-contain p-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sağ: Bilgi */}
          <div className="flex flex-col">
            {/* Marka */}
            {product.brand && (
              <Link href={`/urunler?marka=${product.brand.slug}`} className="block mb-5 group">
                {product.brand.logo ? (
                  <div className="relative h-10 w-32">
                    <Image src={product.brand.logo} alt={product.brand.name} fill className="object-contain object-left" />
                  </div>
                ) : (
                  <span className="font-sans text-[10px] tracking-[0.4em] text-[#C4A882] uppercase group-hover:text-[#8B6F4E] transition-colors">
                    {product.brand.name}
                  </span>
                )}
              </Link>
            )}

            {product.category && (
              <p className="font-sans text-[10px] tracking-[0.3em] text-[#9A9A9A] uppercase mb-3">
                {product.category.name}
              </p>
            )}

            <h1 className="font-serif text-3xl md:text-4xl font-light text-[#1A1A1A] leading-tight mb-6">
              {product.name}
            </h1>

            {/* Fiyat */}
            <div className="flex items-baseline gap-4 mb-3">
              <span className="font-serif text-3xl text-[#1A1A1A]">{price.toLocaleString("tr-TR")} ₺</span>
              {compare && <span className="font-sans text-lg text-[#C4A882] line-through">{compare.toLocaleString("tr-TR")} ₺</span>}
              {discount && (
                <span className="font-sans text-xs bg-[#F5F0EA] text-[#8B6F4E] border border-[#E8E4DE] px-2.5 py-1 tracking-wide">
                  %{discount} indirim
                </span>
              )}
            </div>

            {/* Stok */}
            <p className="font-sans text-xs text-[#6B6B6B] mb-8 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Stokta mevcut · Hızlı kargo
            </p>

            <div className="w-12 h-[1px] bg-[#C4A882] mb-8" />

            {/* Açıklama */}
            {product.description && (
              <p className="font-sans text-[#6B6B6B] text-sm leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {/* Butonlar */}
            <div className="flex flex-col gap-3 mb-10">
              <a
                href={`https://wa.me/${WA}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.3em] uppercase py-5 hover:bg-[#C4A882] transition-colors duration-300"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp&apos;tan Sipariş Ver
              </a>
              <a
                href={`https://wa.me/${WA}?text=${encodeURIComponent("Merhaba, parfüm önerisi almak istiyorum.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center border border-[#E8E4DE] text-[#6B6B6B] font-sans text-[11px] tracking-[0.3em] uppercase py-4 hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
              >
                Öneri Almak İçin Yazın
              </a>
            </div>

            {/* Accordion */}
            <ProductDetailClient />
          </div>
        </div>

        {/* İlgili ürünler */}
        {related.length > 0 && (
          <div className="mt-24 pt-14 border-t border-[#E8E4DE]">
            <div className="text-center mb-12">
              <p className="font-sans text-[10px] tracking-[0.5em] text-[#C4A882] uppercase mb-3">Sizin İçin Seçtik</p>
              <h2 className="font-serif text-3xl font-light text-[#1A1A1A]">Bunları da Beğenebilirsiniz</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((r) => (
                <ProductCard key={r.id} product={r as never} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
