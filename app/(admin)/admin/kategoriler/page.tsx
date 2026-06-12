import { mockCategories } from "@/lib/mock-data";

export default function KategorilerPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
          Kategoriler
        </h2>
        <button className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
          + Kategori Ekle
        </button>
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">
                Kategori
              </th>
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">
                Slug
              </th>
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">
                Açıklama
              </th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {mockCategories.map((cat, i) => (
              <tr
                key={cat.id}
                className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${
                  i === mockCategories.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-6 py-4 font-medium text-[#2c1810]">
                  {cat.name}
                </td>
                <td className="px-6 py-4 text-[#8b6f5e]">/{cat.slug}</td>
                <td className="px-6 py-4 text-[#5c4033]">{cat.description}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs text-[#8b6f5e] hover:text-[#2c1810] mr-4">
                    Düzenle
                  </button>
                  <button className="text-xs text-red-400 hover:text-red-600">
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
