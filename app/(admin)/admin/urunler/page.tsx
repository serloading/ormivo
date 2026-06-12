import Link from "next/link";
import AdminUrunlerClient from "@/components/admin/AdminUrunlerClient";
import { mockProducts } from "@/lib/mock-data";

export default function AdminUrunlerPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
            Ürünler
          </h2>
          <p className="text-sm text-[#8b6f5e] mt-1">
            {mockProducts.length} ürün
          </p>
        </div>
        <Link
          href="/admin/urunler/yeni"
          className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors"
        >
          + Ürün Ekle
        </Link>
      </div>
      <AdminUrunlerClient products={mockProducts} />
    </div>
  );
}
