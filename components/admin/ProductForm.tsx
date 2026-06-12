"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MockProduct } from "@/lib/mock-data";
import { mockCategories } from "@/lib/mock-data";

type Props = {
  product?: MockProduct;
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product?.price?.toString() ?? "",
    comparePrice: product?.comparePrice?.toString() ?? "",
    categorySlug: product?.categorySlug ?? "",
    stock: product?.stock?.toString() ?? "0",
    isActive: product?.isActive ?? true,
  });

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: isEdit ? prev.slug : toSlug(name),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Supabase bağlanınca burada API çağrısı yapılacak
    alert(isEdit ? "Ürün güncellendi! (mock)" : "Ürün eklendi! (mock)");
    router.push("/admin/urunler");
  }

  const inputClass =
    "w-full border border-[#d4c5ba] rounded-sm px-4 py-3 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] transition-colors bg-[#faf8f6]";
  const labelClass =
    "block text-xs font-medium tracking-widest text-[#5c4033] uppercase mb-2";

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ana bilgiler */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">
              Ürün Bilgileri
            </h3>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>Ürün Adı *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={inputClass}
                  placeholder="Ambra Noir"
                />
              </div>

              <div>
                <label className={labelClass}>Slug (URL)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, slug: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="ambra-noir"
                />
                <p className="text-xs text-[#b8a89e] mt-1">
                  /urunler/{form.slug || "slug"}
                </p>
              </div>

              <div>
                <label className={labelClass}>Açıklama</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Ürün açıklaması..."
                />
              </div>
            </div>
          </div>

          {/* Görsel yükleme */}
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">
              Görseller
            </h3>
            <div className="border-2 border-dashed border-[#d4c5ba] rounded-sm p-10 text-center">
              <span className="text-3xl text-[#d4c5ba]">◈</span>
              <p className="text-sm text-[#8b6f5e] mt-3">
                Görsel yüklemek için tıklayın
              </p>
              <p className="text-xs text-[#b8a89e] mt-1">
                PNG, JPG — maks. 5MB
              </p>
              <p className="text-xs text-[#b8a89e] mt-3">
                (Cloudinary entegrasyonu Supabase bağlantısından sonra aktif
                olacak)
              </p>
            </div>
          </div>
        </div>

        {/* Sağ panel */}
        <div className="space-y-6">
          {/* Durum */}
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">
              Durum
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isActive: e.target.checked }))
                }
                className="w-4 h-4 accent-[#2c1810]"
              />
              <span className="text-sm text-[#5c4033]">Aktif (yayında)</span>
            </label>
          </div>

          {/* Fiyat */}
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">
              Fiyat
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Satış Fiyatı (₺) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="890"
                />
              </div>
              <div>
                <label className={labelClass}>İndirimli Fiyat (₺)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.comparePrice}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, comparePrice: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="1100"
                />
              </div>
            </div>
          </div>

          {/* Kategori */}
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">
              Kategori
            </h3>
            <select
              value={form.categorySlug}
              onChange={(e) =>
                setForm((p) => ({ ...p, categorySlug: e.target.value }))
              }
              className={inputClass}
            >
              <option value="">Kategori seçin</option>
              {mockCategories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stok */}
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">
              Stok
            </h3>
            <div>
              <label className={labelClass}>Stok Adedi</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stock: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Kaydet */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase py-3 hover:bg-[#3d2418] transition-colors"
            >
              {isEdit ? "Güncelle" : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/urunler")}
              className="px-4 border border-[#d4c5ba] text-[#5c4033] text-xs tracking-wide hover:bg-[#f5f0eb] transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
