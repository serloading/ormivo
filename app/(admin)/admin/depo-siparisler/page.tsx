import { getDepoSiparisler, getDepoSuppliers } from "@/lib/actions/depo-siparis";
import { getUsdRate } from "@/lib/actions/settings";
import DepoSiparisClient from "@/components/admin/DepoSiparisClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Depo Siparişleri — Ormivo Admin" };

export default async function DepoSiparislerPage() {
  const [siparisler, usdRate, suppliers] = await Promise.all([getDepoSiparisler(), getUsdRate(), getDepoSuppliers()]);
  return <DepoSiparisClient siparisler={siparisler as never} usdRate={usdRate} suppliers={suppliers} />;
}
