import Link from "next/link";
import { mockProducts } from "@/lib/mock-data";

export default function AdminUrunlerPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
            Ürünler
          </h2>
          <p className="text-sm text-[#8b6f5e] mt-1">
            {mockProducts.length} ürün
          </p>
        </div>
        <Link
          href="/admin/urunler/yeni"
          className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors"
        >
          + Ürün Ekle
        </Link>
      </div>

      {/* Arama/filtre */}
      <div className="bg-white border border-[#e8ddd6] rounded-sm p-4 mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Ürün ara..."
          className="flex-1 border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]"
        />
        <select className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tüm Kategoriler</option>
          <option value="kadin">Kadın</option>
          <option value="erkek">Erkek</option>
          <option value="unisex">Unisex</option>
        </select>
      </div>

      {/* Tablo */}
      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">
                Ürün
              </th>
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">
                Kategori
              </th>
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">
                Fiyat
              </th>
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">
                Stok
              </th>
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">
                Durum
              </th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {mockProducts.map((product, i) => (
              <tr
                key={product.id}
                className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] transition-colors ${
                  i === mockProducts.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-[#2c1810]">{product.name}</p>
                    <p className="text-xs text-[#b8a89e] mt-0.5">
                      /{product.slug}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-[#5c4033]">{product.category}</td>
                <td className="px-6 py-4">
                  <span className="text-[#2c1810]">
                    {product.price.toLocaleString("tr-TR")} ₺
                  </span>
                  {product.comparePrice && (
                    <span className="text-xs text-[#b8a89e] line-through ml-2">
                      {product.comparePrice.toLocaleString("tr-TR")} ₺
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={
                      product.stock < 5
                        ? "text-red-600 font-medium"
                        : "text-[#5c4033]"
                    }
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block text-xs px-3 py-1 rounded-full ${
                      product.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {product.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/urunler/${product.id}/duzenle`}
                    className="text-xs text-[#8b6f5e] hover:text-[#2c1810] transition-colors mr-4"
                  >
                    Düzenle
                  </Link>
                  <button className="text-xs text-red-400 hover:text-red-600 transition-colors">
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
