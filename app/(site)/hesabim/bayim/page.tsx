import { redirect }  from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma }     from "@/lib/prisma";
import Link           from "next/link";
import BayimClient    from "./BayimClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bayim — Ormivo" };

export default async function BayimPage() {
  const session = await getSession();
  if (!session) redirect("/giris");
  if (!session.isB2BApproved) redirect("/hesabim");

  const user = await prisma.siteUser.findUnique({
    where: { id: session.userId },
    select: {
      referralCode: true,
      referrals: {
        select: {
          id: true, name: true, phone: true, createdAt: true,
          siteOrders: { select: { total: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) redirect("/giris");

  const referralCode = user.referralCode ?? "";

  const referrals = user.referrals.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    createdAt: r.createdAt.toISOString(),
    orderCount: r.siteOrders.length,
    orderTotal: r.siteOrders.reduce((s, o) => s + Number(o.total), 0),
  }));

  // Siparişleri çek (tüm referral müşterilerinin)
  const referralUserIds = referrals.map((r) => r.id);
  const rawOrders = referralUserIds.length > 0
    ? await prisma.siteOrder.findMany({
        where: { userId: { in: referralUserIds }, status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, orderNo: true, createdAt: true, status: true, total: true,
          user: { select: { name: true } },
        },
      })
    : [];

  const referralOrders = rawOrders.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    total: Number(o.total),
    userName: o.user?.name ?? null,
  }));

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/hesabim" className="font-sans text-xs text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors">
            ← Hesabım
          </Link>
        </div>

        <div className="bg-white border border-[#E8E4DE] p-6">
          <h1 className="font-serif text-2xl text-[#1A1A1A] mb-1">Bayi Panelim</h1>
          <p className="font-sans text-xs text-[#9A9A9A] mb-6">Referans linkinizi paylaşın, müşterilerinizi ve siparişlerini takip edin.</p>

          <BayimClient
            referralCode={referralCode}
            referralCount={referrals.length}
            referrals={referrals}
            referralOrders={referralOrders}
          />
        </div>
      </div>
    </div>
  );
}
