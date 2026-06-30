import { prisma } from "@/lib/prisma";
import BayilerClient from "@/components/admin/BayilerClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bayi Yönetimi — Ormivo Admin" };

export default async function BayilerPage() {
  const users = await prisma.siteUser.findMany({
    where: { OR: [{ isB2B: true }, { isB2BApproved: true }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, phone: true, email: true,
      isB2B: true, isB2BApproved: true, b2bNote: true,
      createdAt: true,
      _count: { select: { siteOrders: true } },
    },
  });

  const pending = users.filter((u) => u.isB2B && !u.isB2BApproved);
  const approved = users.filter((u) => u.isB2BApproved);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Bayi Yönetimi</h2>
        <p className="text-sm text-[#8b6f5e] mt-1">
          {pending.length} bekleyen başvuru · {approved.length} onaylı bayi
        </p>
      </div>
      <BayilerClient pending={pending} approved={approved} />
    </div>
  );
}
