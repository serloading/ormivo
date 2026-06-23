import Link from "next/link";

export const metadata = { title: "Siparişiniz Alındı — Ormivo" };

export default async function SiparisTamamlandiPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNo?: string }>;
}) {
  const { orderNo } = await searchParams;

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

          <p className="font-sans text-xs text-[#9A9A9A] mb-8">
            Kargo takip numaranız hazırlandığında hesabınızdaki sipariş geçmişinizden takip edebilirsiniz.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/" className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors block text-center">
              Alışverişe Devam Et
            </Link>
            <Link href="/hesabim" className="w-full border border-[#E8E4DE] text-[#6B6B6B] font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:border-[#C4A882] hover:text-[#1A1A1A] transition-colors block text-center">
              Siparişlerimi Görüntüle
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
