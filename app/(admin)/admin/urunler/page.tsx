import Link from "next/link";
import AdminUrunlerClient from "@/components/admin/AdminUrunlerClient";
import UsdRateWidget from "@/components/admin/UsdRateWidget";
import { getProducts } from "@/lib/actions/product";
import { getCategories } from "@/lib/actions/category";
import { getBrands } from "@/lib/actions/brand";
import { getUsdRate } from "@/lib/actions/settings";

export default async function AdminUrunlerPage() {
  const [products, categories, brands, usdRate] = await Promise.all([getProducts(), getCategories(), getBrands(), getUsdRate()]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Ürünler</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">{products.length} ürün</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/api/admin/products-export"
            className="border border-[#d4c5ba] text-[#5c4033] text-xs tracking-widest uppercase px-5 py-3 hover:bg-[#f5f0eb] transition-colors">
            ↓ Excel Export
          </a>
          <Link href="/admin/urunler/yeni"
            className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
            + Ürün Ekle
          </Link>
        </div>
      </div>
      <div className="mb-6">
        <UsdRateWidget initialRate={usdRate} />
      </div>
      <AdminUrunlerClient products={products} categories={categories} brands={brands} usdRate={usdRate} />
    </div>
  );
}
