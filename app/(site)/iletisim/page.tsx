export const metadata = { title: "İletişim — Ormivo" };

export default function IletisimPage() {
  return (
    <div className="bg-[#faf8f6] min-h-screen">
      <div className="border-b border-[#e8ddd6] bg-[#f5f0eb] py-16 text-center">
        <p className="text-xs tracking-[0.5em] text-[#8b6f5e] uppercase mb-3">
          Ormivo
        </p>
        <h1 className="text-3xl font-light tracking-[0.2em] text-[#2c1810] uppercase">
          İletişim
        </h1>
      </div>

      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-sm text-[#5c4033] leading-relaxed mb-10">
          Sipariş vermek, ürünler hakkında bilgi almak veya her türlü sorunuz
          için WhatsApp üzerinden bize ulaşabilirsiniz.
        </p>

        <a
          href="https://wa.me/905465402113"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#2c1810] text-[#f5f0eb] text-xs tracking-[0.3em] uppercase px-10 py-4 hover:bg-[#3d2418] transition-colors mb-6"
        >
          WhatsApp&apos;tan Yaz
        </a>

        <p className="text-sm text-[#8b6f5e]">+90 546 540 2113</p>
      </div>
    </div>
  );
}
