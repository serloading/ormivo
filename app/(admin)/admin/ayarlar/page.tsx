import { getSegmentSettings, getTransferInfo } from "@/lib/actions/settings";
import AyarlarClient from "./AyarlarClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ayarlar — Admin" };

export default async function AyarlarPage() {
  const [segmentRates, transferInfo] = await Promise.all([
    getSegmentSettings(),
    getTransferInfo(),
  ]);
  return <AyarlarClient segmentRates={segmentRates} transferInfo={transferInfo} />;
}
