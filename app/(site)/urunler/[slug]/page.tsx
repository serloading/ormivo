import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductDetailClient from "./ProductDetailClient";
import ProductCard from "@/components/site/ProductCard";

const WA_NUMBER = "905465402113";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ where: { deletedAt: null }, select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({ where: { slug, deletedAt: null } });
  if (!product) return {};
  return { title: `${product.name} — Ormivo` };
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

  const waMsg = encodeURIComponent(`Merhaba, ${product.name} ürününü sipariş etmek istiyorum.`);
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;

  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const discount = comparePrice ? Math.round((1 - price / comparePrice) * 100) : null;

  return (
    <div className="bg-[#faf8f6] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#b8a89e] mb-12">
          <Link href="/" className="hover:text-[#5c4033] transition-colors">Ana Sayfa</Link>
          <span className="text-[#d4c5ba]">/</span>
          <Link href="/urunler" className="hover:text-[#5c4033] transition-colors">Koleksiyon</Link>
          {product.brand && (
            <>
              <span className="text-[#d4c5ba]">/</span>
              <Link href={`/urunler?marka=${product.brand.slug}`} className="hover:text-[#5c4033] transition-colors">{product.brand.name}</Link>
            </>
          )}
          <span className="text-[#d4c5ba]">/</span>
          <span className="text-[#5c4033]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Sol: Görsel */}
          <div>
            <div className="aspect-square bg-[#f0ebe4] border border-[#e8ddd6] relative overflow-hidden">
              {product.images?.[0] ? (
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" priority />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl text-[#d4c5ba]">◈</span>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {product.images.slice(1, 5).map((img, i) => (
                  <div key={i} className="aspect-square bg-[#f0ebe4] border border-[#e8ddd6] relative overflow-hidden">
                    <Image src={img} alt={`${product.name} ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sağ: Bilgi */}
          <div className="flex flex-col">
            {/* Marka */}
            {product.brand && (
              <Link href={`/urunler?marka=${product.brand.slug}`} className="block mb-5">
                {product.brand.logo ? (
                  <div className="relative h-10 w-32">
                    <Image src={product.brand.logo} alt={product.brand.name} fill className="object-contain object-left" />
                  </div>
                ) : (
                  <span className="text-[10px] tracking-[0.6em] text-[#c4a882] uppercase font-medium hover:opacity-70 transition-opacity">
                    {product.brand.name}
                  </span>
                )}
              </Link>
            )}

            {product.category && (
              <p className="text-[10px] tracking-[0.5em] text-[#8b6f5e] uppercase mb-3">{product.category.name}</p>
            )}

            <h1 className="text-3xl md:text-4xl font-light tracking-wide text-[#2c1810] mb-6 leading-tight">{product.name}</h1>

            {/* Fiyat */}
            <div className="flex items-baseline gap-4 mb-3">
              <span className="text-3xl font-light text-[#2c1810]">{price.toLocaleString("tr-TR")} ₺</span>
              {comparePrice && <span className="text-lg text-[#b8a89e] line-through">{comparePrice.toLocaleString("tr-TR")} ₺</span>}
              {discount && <span className="text-sm bg-[#f0ebe4] text-[#8b6f5e] px-2 py-0.5 rounded-sm">%{discount} indirim</span>}
            </div>

            {/* Stok */}
            <p className="text-xs text-green-700 mb-8 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Stokta mevcut — Hızlı kargo
            </p>

            <div className="w-10 border-t border-[#d4c5ba] mb-8" />

            {product.description && (
              <p className="text-sm text-[#5c4033] leading-relaxed mb-8 font-light">{product.description}</p>
            )}

            {/* Butonlar */}
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="block text-center bg-[#2c1810] text-[#f5f0eb] text-[11px] tracking-[0.35em] uppercase px-10 py-5 hover:bg-[#3d2418] transition-colors mb-3">
              WhatsApp&apos;tan Sipariş Ver
            </a>
            <a href="https://wa.me/905465402113" target="_blank" rel="noopener noreferrer"
              className="block text-center border border-[#d4c5ba] text-[#5c4033] text-[11px] tracking-[0.35em] uppercase px-10 py-4 hover:border-[#2c1810] hover:text-[#2c1810] transition-colors mb-10">
              Öneri Almak İçin Yazın
            </a>

            {/* Accordion: Kullanım & Öneriler */}
            <ProductDetailClient />
          </div>
        </div>

        {/* İlgili Ürünler */}
        {related.length > 0 && (
          <div className="mt-24 pt-12 border-t border-[#e8ddd6]">
            <div className="text-center mb-10">
              <p className="text-[10px] tracking-[0.6em] text-[#8b6f5e] uppercase mb-3">Keşfedin</p>
              <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Bunları da Beğenebilirsiniz</h2>
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
