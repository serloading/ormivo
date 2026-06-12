export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl text-[#d4c5ba] animate-pulse">◈</div>
        <p className="text-xs tracking-widest text-[#b8a89e] uppercase mt-3">
          Yükleniyor
        </p>
      </div>
    </div>
  );
}
