import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-6xl font-light text-[#d4c5ba] mb-6">404</p>
        <h1 className="text-2xl font-light tracking-wide text-[#2c1810] mb-4">
          Sayfa Bulunamadı
        </h1>
        <p className="text-sm text-[#8b6f5e] mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          href="/"
          className="inline-block border border-[#2c1810] text-[#2c1810] text-xs tracking-[0.3em] uppercase px-8 py-3 hover:bg-[#2c1810] hover:text-[#f5f0eb] transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
