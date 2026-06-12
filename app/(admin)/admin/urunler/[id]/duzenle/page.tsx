import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { mockProducts } from "@/lib/mock-data";

export default function UrunDuzenlePage({
  params,
}: {
  params: { id: string };
}) {
  const product = mockProducts.find((p) => p.id === params.id);
  if (!product) notFound();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
          Ürün Düzenle
        </h2>
        <p className="text-sm text-[#8b6f5e] mt-1">{product.name}</p>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
