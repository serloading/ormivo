"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
      <div className="text-center">
        <p className="font-serif text-5xl text-[#C4A882] mb-4">◈</p>
        <h1 className="font-serif text-2xl text-[#1A1A1A] mb-2">Bir hata oluştu</h1>
        <p className="font-sans text-sm text-[#9A9A9A] mb-6">Beklenmedik bir sorunla karşılaşıldı.</p>
        <button
          onClick={reset}
          className="font-sans text-[11px] tracking-[0.2em] uppercase px-6 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#C4A882] transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
