export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-2xl text-[#d4c5ba] animate-pulse">◈</div>
        <p className="text-xs tracking-widest text-[#b8a89e] uppercase mt-3">Yükleniyor</p>
      </div>
    </div>
  );
}
