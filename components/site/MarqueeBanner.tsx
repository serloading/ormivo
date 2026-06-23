const ITEMS = [
  "Ücretsiz Kargo",
  "2 Gün İçinde Teslim",
  "500+ Ürün",
  "Premium Markalar",
  "Orjinal & Sertifikalı",
  "Güvenli Alışveriş",
];

export default function MarqueeBanner() {
  const repeated = [...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className="bg-[#1A1A1A] text-white overflow-hidden py-2.5">
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 mx-6 font-sans text-[10px] tracking-[0.25em] uppercase">
            <span className="text-[#C4A882]">◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
