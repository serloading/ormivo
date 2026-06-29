import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/actions/category";
import { getBrands } from "@/lib/actions/brand";
import { getUsdRate } from "@/lib/actions/settings";

export default async function YeniUrunPage() {
  const [categories, brands, usdRate] = await Promise.all([getCategories(), getBrands(), getUsdRate()]);
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Yeni Ürün</h2>
      </div>
      <ProductForm categories={categories} brands={brands} usdRate={usdRate} />
    </div>
  );
}
