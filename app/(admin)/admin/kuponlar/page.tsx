import { getCoupons } from "@/lib/actions/coupon";
import { getSegmentSettings } from "@/lib/actions/settings";
import KuponlarClient from "./KuponlarClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kuponlar & Ayarlar — Admin" };

export default async function KuponlarPage() {
  const [coupons, segmentRates] = await Promise.all([getCoupons(), getSegmentSettings()]);
  return (
    <KuponlarClient
      coupons={coupons.map((c) => ({
        ...c,
        discountValue:  Number(c.discountValue),
        minOrderTotal:  c.minOrderTotal ? Number(c.minOrderTotal) : null,
        expiresAt:      c.expiresAt ? c.expiresAt.toISOString() : null,
        createdAt:      c.createdAt.toISOString(),
      }))}
      segmentRates={segmentRates}
    />
  );
}
