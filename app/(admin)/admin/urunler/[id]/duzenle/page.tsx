import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/actions/category";
import { getBrands } from "@/lib/actions/brand";

export default async function UrunDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { category: true, brand: true } }),
    getCategories(),
    getBrands(),
  ]);
  if (!product) notFound();

  const p = {
    ...product,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    costPrice: product.costPrice ? Number(product.costPrice) : null,
    costPriceUsd: product.costPriceUsd ? Number(product.costPriceUsd) : null,
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Ürün Düzenle</h2>
        <p className="text-sm text-[#8b6f5e] mt-1">{product.name}</p>
      </div>
      <ProductForm product={p} categories={categories} brands={brands} />
    </div>
  );
}
