import { prisma } from "@/lib/prisma";
import BayilerClient, { BayiEkleButton } from "@/components/admin/BayilerClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bayi Yönetimi — Ormivo Admin" };

export default async function BayilerPage() {
  const users = await prisma.siteUser.findMany({
    where: { isB2BApproved: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, phone: true, email: true,
      isB2B: true, isB2BApproved: true, b2bNote: true,
      referralCode: true,
      createdAt: true,
      _count: { select: { siteOrders: true, referrals: true } },
    },
  });

  const pending: typeof users = [];
  const approved = users;

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Bayi Yönetimi</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">{approved.length} onaylı bayi</p>
        </div>
        <BayiEkleButton />
      </div>
      <BayilerClient pending={pending} approved={approved} />
    </div>
  );
}
