import MarkalarClient from "@/components/admin/MarkalarClient";
import { getBrands } from "@/lib/actions/brand";

export default async function AdminMarkalarPage() {
  const brands = await getBrands();
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Markalar</h2>
        <p className="text-sm text-[#8b6f5e] mt-1">{brands.length} marka</p>
      </div>
      <MarkalarClient brands={brands} />
    </div>
  );
}
