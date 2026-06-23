import { getSession } from "@/lib/session";
import { getCart }    from "@/lib/actions/cart";
import { prisma }     from "@/lib/prisma";
import LoggedInCart   from "@/components/site/LoggedInCart";
import GuestCart      from "@/components/site/GuestCart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sepetim — Ormivo" };

export default async function SepetPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="bg-[#FAFAF7] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <h1 className="font-serif text-3xl text-[#1A1A1A] mb-8">Sepetim</h1>
          <GuestCart />
        </div>
      </div>
    );
  }

  const [cart, addresses] = await Promise.all([
    getCart(),
    prisma.address.findMany({
      where:   { userId: session.userId },
      orderBy: { isDefault: "desc" },
    }),
  ]);

  const items = cart?.items ?? [];

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <h1 className="font-serif text-3xl text-[#1A1A1A] mb-1">Sepetim</h1>
        <p className="font-sans text-sm text-[#9A9A9A] mb-8">
          {session.name ? `Merhaba ${session.name}` : session.phone}
        </p>
        <LoggedInCart items={items} addresses={addresses} />
      </div>
    </div>
  );
}
