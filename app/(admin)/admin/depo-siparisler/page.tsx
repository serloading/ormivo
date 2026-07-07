import { getDepoSiparisler, getDepoSuppliers } from "@/lib/actions/depo-siparis";
import { getUsdRate } from "@/lib/actions/settings";
import { prisma } from "@/lib/prisma";
import DepoSiparisClient from "@/components/admin/DepoSiparisClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Depo Siparişleri — Ormivo Admin" };

export default async function DepoSiparislerPage() {
  const [siparisler, usdRate, suppliers, supplierDebtSums] = await Promise.all([
    getDepoSiparisler(),
    getUsdRate(),
    getDepoSuppliers(),
    prisma.supplierDebt.groupBy({ by: ["supplierName"], _sum: { totalAmount: true, paidAmount: true } }),
  ]);
  // Tedarikçi bazında geçmişten kalan toplam bakiye (tüm depo siparişlerindeki SupplierDebt kayıtları toplamı)
  const supplierBalances = Object.fromEntries(
    supplierDebtSums.map((s) => [
      s.supplierName,
      Math.max(0, Number(s._sum.totalAmount ?? 0) - Number(s._sum.paidAmount ?? 0)),
    ])
  );
  return <DepoSiparisClient siparisler={siparisler as never} usdRate={usdRate} suppliers={suppliers} supplierBalances={supplierBalances} />;
}
