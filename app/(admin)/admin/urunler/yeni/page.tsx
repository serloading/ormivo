import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/actions/category";
import { getBrands } from "@/lib/actions/brand";

export default async function YeniUrunPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Yeni Ürün</h2>
      </div>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
