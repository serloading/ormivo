import Link from "next/link";

export const metadata = { title: "Ödeme Başarısız — Ormivo" };

export default async function OdemeBasarisizPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNo?: string }>;
}) {
  const { orderNo } = await searchParams;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#FAFAF7]">
      <div className="w-full max-w-md text-center">
        <div className="bg-white border border-red-200 px-8 py-12">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="font-serif text-2xl text-[#1A1A1A] mb-3">Ödeme Tamamlanamadı</h1>
          <p className="font-sans text-sm text-[#6B6B6B] leading-relaxed mb-6">
            Ödeme işlemi başarısız oldu veya iptal edildi. Siparişiniz beklemede.
          </p>

          {orderNo && (
            <div className="bg-[#FAFAF7] border border-[#E8E4DE] px-4 py-3 mb-6">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] mb-1">Sipariş Numarası</p>
              <p className="font-serif text-lg text-[#1A1A1A] tracking-wider">{orderNo}</p>
            </div>
          )}

          <p className="font-sans text-xs text-[#9A9A9A] mb-8">
            Tekrar denemek veya havale ile ödemek için siparişlerinize gidin.
          </p>

          <div className="flex flex-col gap-3">
            {orderNo && (
              <Link href={`/siparis-odeme/${orderNo}`}
                className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors block text-center">
                Tekrar Dene
              </Link>
            )}
            <Link href="/hesabim"
              className="w-full border border-[#E8E4DE] text-[#6B6B6B] font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:border-[#C4A882] hover:text-[#1A1A1A] transition-colors block text-center">
              Siparişlerime Git
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
