import { getCoupons } from "@/lib/actions/coupon";
import KuponlarClient from "./KuponlarClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kuponlar — Admin" };

export default async function KuponlarPage() {
  const coupons = await getCoupons();
  return <KuponlarClient coupons={coupons.map((c) => ({ ...c, discountValue: Number(c.discountValue), minOrderTotal: c.minOrderTotal ? Number(c.minOrderTotal) : null, expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null, createdAt: c.createdAt.toISOString() }))} />;
}
