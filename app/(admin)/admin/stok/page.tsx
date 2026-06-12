import { mockProducts } from "@/lib/mock-data";

export default function StokPage() {
  const sorted = [...mockProducts].sort((a, b) => a.stock - b.stock);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
          Stok Takibi
        </h2>
        <p className="text-sm text-[#8b6f5e] mt-1">
          {mockProducts.filter((p) => p.stock < 5).length} ürün düşük stokta
        </p>
      </div>

      {/* Uyarı */}
      {mockProducts.some((p) => p.stock < 5) && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6">
          <p className="text-sm text-red-700">
            ⚠ {mockProducts.filter((p) => p.stock < 5).length} ürün 5 adetten
            az stokta — sipariş almadan önce kontrol edin.
          </p>
        </div>
      )}

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Ürün", "Kategori", "Stok", "Durum", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr
                key={p.id}
                className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${
                  i === sorted.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-6 py-4 font-medium text-[#2c1810]">
                  {p.name}
                </td>
                <td className="px-6 py-4 text-[#5c4033]">{p.category}</td>
                <td className="px-6 py-4">
                  <span
                    className={`font-medium ${
                      p.stock === 0
                        ? "text-red-600"
                        : p.stock < 5
                        ? "text-orange-500"
                        : "text-[#2c1810]"
                    }`}
                  >
                    {p.stock} adet
                  </span>
                </td>
                <td className="px-6 py-4">
                  {p.stock === 0 ? (
                    <span className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full">
                      Tükendi
                    </span>
                  ) : p.stock < 5 ? (
                    <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                      Düşük
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      Yeterli
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">
                    Güncelle
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
