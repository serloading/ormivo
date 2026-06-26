import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata = { title: "Siparişiniz Alındı — Ormivo" };

function toWaPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("90")) return d;
  if (d.startsWith("0"))  return "9" + d;
  return "90" + d;
}

export default async function SiparisTamamlandiPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNo?: string }>;
}) {
  const { orderNo } = await searchParams;
  const session = await getSession();

  // Sipariş detaylarını çek (WhatsApp mesajı için)
  let orderDetails: {
    items: { name: string; qty: number; price: number }[];
    total: number;
    discount: number;
    customerPhone: string | null;
  } | null = null;

  if (orderNo) {
    const order = await prisma.siteOrder.findUnique({
      where: { orderNo },
      select: {
        items: true,
        total: true,
        discount: true,
        user: { select: { phone: true } },
      },
    });
    if (order) {
      orderDetails = {
        items: order.items as { name: string; qty: number; price: number }[],
        total: Number(order.total),
        discount: Number(order.discount ?? 0),
        customerPhone: order.user?.phone ?? null,
      };
    }
  }

  // WhatsApp mesajı oluştur
  let waUrl: string | null = null;
  if (orderDetails && orderNo) {
    const indirimliTutar = Math.max(0, orderDetails.total - orderDetails.discount);
    const lines = [
      `Merhaba, #${orderNo} numaralı siparişim:`,
      ``,
      ...orderDetails.items.map((i) => `• ${i.name} ×${i.qty} = ${(i.price * i.qty).toLocaleString("tr-TR")} ₺`),
      ``,
      `Toplam: ${indirimliTutar.toLocaleString("tr-TR")} ₺`,
      ``,
      `Siparişimi onaylar mısınız?`,
    ];
    const text = encodeURIComponent(lines.join("\n"));
    const customerWa = orderDetails.customerPhone ? toWaPhone(orderDetails.customerPhone) : null;
    if (customerWa) waUrl = `https://wa.me/${customerWa}?text=${text}`;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#FAFAF7]">
      <div className="w-full max-w-md text-center">
        <div className="bg-white border border-[#E8E4DE] px-8 py-12">
          <div className="w-16 h-16 rounded-full bg-[#EDE5D8] flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-[#C4A882]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="font-serif text-2xl text-[#1A1A1A] mb-3">Siparişiniz Alındı!</h1>
          <p className="font-sans text-sm text-[#6B6B6B] leading-relaxed mb-6">
            Siparişiniz başarıyla oluşturuldu. En kısa sürede sizinle iletişime geçeceğiz.
          </p>

          {orderNo && (
            <div className="bg-[#FAFAF7] border border-[#E8E4DE] px-4 py-3 mb-6">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] mb-1">Sipariş Numaranız</p>
              <p className="font-serif text-lg text-[#1A1A1A] tracking-wider">{orderNo}</p>
            </div>
          )}

          {/* Sipariş özeti */}
          {orderDetails && orderDetails.items.length > 0 && (
            <div className="bg-[#FAFAF7] border border-[#E8E4DE] px-4 py-3 mb-6 text-left">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] mb-3">Sipariş Özeti</p>
              <div className="space-y-1.5">
                {orderDetails.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#4A4A4A]">{item.name} <span className="text-[#9A9A9A]">×{item.qty}</span></span>
                    <span className="text-[#1A1A1A] font-medium">{(item.price * item.qty).toLocaleString("tr-TR")} ₺</span>
                  </div>
                ))}
                {orderDetails.discount > 0 && (
                  <div className="flex justify-between text-sm border-t border-[#E8E4DE] pt-1.5 mt-1.5">
                    <span className="text-[#9A9A9A]">İndirim</span>
                    <span className="text-orange-600">-{orderDetails.discount.toLocaleString("tr-TR")} ₺</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-[#E8E4DE] pt-1.5 mt-1.5">
                  <span className="text-[#1A1A1A]">Toplam</span>
                  <span className="text-[#C4A882]">{Math.max(0, orderDetails.total - orderDetails.discount).toLocaleString("tr-TR")} ₺</span>
                </div>
              </div>
            </div>
          )}

          <p className="font-sans text-xs text-[#9A9A9A] mb-8">
            Kargo takip numaranız hazırlandığında hesabınızdaki sipariş geçmişinizden takip edebilirsiniz.
          </p>

          <div className="flex flex-col gap-3">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-sans text-[11px] tracking-[0.2em] uppercase py-3 hover:bg-[#1ebe5d] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Sipariş Özetini Kendine Gönder
              </a>
            )}
            <Link href="/" className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors block text-center">
              Alışverişe Devam Et
            </Link>
            {session && (
              <Link href="/hesabim" className="w-full border border-[#E8E4DE] text-[#6B6B6B] font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:border-[#C4A882] hover:text-[#1A1A1A] transition-colors block text-center">
                Siparişlerimi Görüntüle
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
