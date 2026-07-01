import { notFound } from "next/navigation";
import { prisma }   from "@/lib/prisma";
import { buildShopierParams, SHOPIER_API_URL } from "@/lib/shopier";

export const dynamic = "force-dynamic";

export default async function SiparisOdemePage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;

  const order = await prisma.siteOrder.findUnique({
    where:  { orderNo },
    select: {
      orderNo:       true,
      total:         true,
      paymentMethod: true,
      paymentStatus: true,
      recipientName: true,
      recipientPhone: true,
      addressLine:   true,
      city:          true,
      user: { select: { phone: true, email: true, name: true } },
    },
  });

  if (!order || order.paymentMethod !== "KART") notFound();
  if (order.paymentStatus === "PAID") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-sans text-sm text-[#6B6B6B]">Bu sipariş zaten ödenmiş.</p>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ormivo.com";
  const shopierParams = buildShopierParams({
    orderNo:      order.orderNo,
    total:        Number(order.total),
    buyerName:    order.recipientName ?? order.user?.name ?? "Müşteri",
    buyerEmail:   order.user?.email ?? "",
    buyerPhone:   order.recipientPhone ?? order.user?.phone ?? "",
    buyerAddress: order.addressLine ?? "",
    buyerCity:    order.city ?? "İstanbul",
    callbackUrl:  `${siteUrl}/api/shopier/callback`,
  });

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#FAFAF7]">
      <div className="bg-white border border-[#E8E4DE] px-8 py-10 text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-full bg-[#EDE5D8] flex items-center justify-center mx-auto mb-4">
          <span className="text-xl">💳</span>
        </div>
        <h1 className="font-serif text-xl text-[#1A1A1A] mb-2">Ödeme Sayfasına Yönlendiriliyorsunuz</h1>
        <p className="font-sans text-xs text-[#9A9A9A] mb-6">Lütfen bekleyin, Shopier ödeme sayfasına aktarılıyorsunuz…</p>
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-[#C4A882] animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-[#C4A882] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-[#C4A882] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>

        <form id="shopier-form" method="POST" action={SHOPIER_API_URL}>
          {Object.entries(shopierParams).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <noscript>
            <button type="submit"
              className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3">
              Ödemeye Geç
            </button>
          </noscript>
        </form>
      </div>

      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('shopier-form').submit();" }} />
    </div>
  );
}
