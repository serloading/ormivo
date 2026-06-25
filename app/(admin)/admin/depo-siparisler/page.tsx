import { getDepoSiparisler } from "@/lib/actions/depo-siparis";
import DepoSiparisClient from "@/components/admin/DepoSiparisClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Depo Siparişleri — Ormivo Admin" };

export default async function DepoSiparislerPage() {
  const siparisler = await getDepoSiparisler();
  return <DepoSiparisClient siparisler={siparisler as never} />;
}
