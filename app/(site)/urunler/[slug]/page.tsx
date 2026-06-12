import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

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

  const waMsg = encodeURIComponent(`Merhaba, ${product.name} ürününü sipariş etmek istiyorum.`);
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;
  const image = product.images?.[0] ?? null;

  return (
    <div className="bg-[#faf8f6] min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <nav className="flex items-center gap-2 text-xs text-[#b8a89e] mb-10">
          <a href="/" className="hover:text-[#5c4033] transition-colors">Ana Sayfa</a>
          <span>/</span>
          <a href="/urunler" className="hover:text-[#5c4033] transition-colors">Koleksiyon</a>
          {product.brand && (
            <>
              <span>/</span>
              <a href={`/urunler?marka=${product.brand.slug}`} className="hover:text-[#5c4033] transition-colors">{product.brand.name}</a>
            </>
          )}
          <span>/</span>
          <span className="text-[#5c4033]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
          <div className="aspect-square bg-[#f5f0eb] border border-[#e8ddd6] flex items-center justify-center relative overflow-hidden">
            {image ? (
              <Image src={image} alt={product.name} fill className="object-cover" />
            ) : (
              <span className="text-8xl text-[#d4c5ba]">◈</span>
            )}
          </div>

          <div className="flex flex-col justify-center">
            {/* Marka logosu / adı */}
            {product.brand && (
              <div className="flex items-center gap-3 mb-4">
                {product.brand.logo ? (
                  <div className="relative h-8 w-20">
                    <Image src={product.brand.logo} alt={product.brand.name} fill className="object-contain object-left" />
                  </div>
                ) : (
                  <p className="text-xs tracking-[0.4em] text-[#8b6f5e] uppercase">{product.brand.name}</p>
                )}
              </div>
            )}

            <p className="text-xs tracking-[0.4em] text-[#8b6f5e] uppercase mb-3">
              {product.category?.name ?? ""}
            </p>
            <h1 className="text-4xl font-light tracking-wide text-[#2c1810] mb-6">{product.name}</h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl text-[#2c1810]">{Number(product.price).toLocaleString("tr-TR")} ₺</span>
              {product.comparePrice && (
                <span className="text-sm text-[#b8a89e] line-through">{Number(product.comparePrice).toLocaleString("tr-TR")} ₺</span>
              )}
            </div>

            <div className="w-12 border-t border-[#d4c5ba] mb-6" />

            {product.description && (
              <p className="text-sm text-[#5c4033] leading-relaxed mb-8">{product.description}</p>
            )}

            <p className="text-xs tracking-wide text-green-700 mb-6">Stokta mevcut</p>

            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="inline-block text-center bg-[#2c1810] text-[#f5f0eb] text-xs tracking-[0.3em] uppercase px-10 py-4 hover:bg-[#3d2418] transition-colors">
              WhatsApp&apos;tan Sipariş Ver
            </a>

            <p className="text-xs text-[#b8a89e] mt-4">+90 546 540 2113 numarasına yönlendirileceksiniz.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
