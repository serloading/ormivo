import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCart } from "@/lib/actions/cart";
import { prisma } from "@/lib/prisma";
import { getSegmentSettings } from "@/lib/actions/settings";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sipariş Tamamla — Ormivo" };

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/giris?redirect=/checkout");

  const [cart, addresses, segmentSettings] = await Promise.all([
    getCart(),
    prisma.address.findMany({
      where:   { userId: session.userId },
      orderBy: { isDefault: "desc" },
    }),
    getSegmentSettings(),
  ]);

  const items = cart?.items ?? [];
  if (items.length === 0) redirect("/sepet");

  const userSegment = session.segment ?? null;
  const isB2B       = session.isB2BApproved ?? false;
  const b2bMarkup   = session.b2bMarkup ?? null;

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-[#1A1A1A] mb-1">Sipariş Tamamla</h1>
          <p className="font-sans text-sm text-[#9A9A9A]">
            {session.name ? `Merhaba ${session.name}` : session.phone}
          </p>
        </div>
        <CheckoutClient
          items={items}
          addresses={addresses}
          userSegment={userSegment}
          isB2B={isB2B}
          b2bMarkup={b2bMarkup}
          segmentSettings={segmentSettings}
          userName={session.name ?? ""}
          userPhone={session.phone ?? ""}
        />
      </div>
    </div>
  );
}
