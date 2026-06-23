import Link from "next/link";
import MusterilerClient from "@/components/admin/MusterilerClient";
import { getCustomers } from "@/lib/actions/customer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Müşteriler — Admin" };

export default async function MusterilerPage() {
  const customers = await getCustomers();
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Müşteriler</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">{customers.length} kayıtlı müşteri</p>
        </div>
        <Link href="/admin/musteriler/yeni"
          className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
          + Müşteri Ekle
        </Link>
      </div>
      <MusterilerClient customers={customers as never} />
    </div>
  );
}
