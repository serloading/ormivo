import { prisma } from "@/lib/prisma";
import SiteSiparislerClient from "./SiteSiparislerClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Siparişleri — Admin" };

export default async function SiteSiparislerPage() {
  const orders = await prisma.siteOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { phone: true, name: true } } },
  });

  return <SiteSiparislerClient orders={orders as never} />;
}
