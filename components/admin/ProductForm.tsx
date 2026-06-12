"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { MockProduct } from "@/lib/mock-data";
import { mockCategories } from "@/lib/mock-data";

type Props = { product?: MockProduct };

function toSlug(text: string) {
  return text.toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const inputCls = "w-full border border-[#d4c5ba] rounded-sm px-4 py-3 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] transition-colors bg-[#faf8f6]";
const labelCls = "block text-xs font-medium tracking-widest text-[#5c4033] uppercase mb-2";

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = !!product;
  const fileRef = useRef<HTMLInputElement>(null);

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

  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleNameChange(name: string) {
    setForm((p) => ({ ...p, name, slug: isEdit ? p.slug : toSlug(name) }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        urls.push(data.url);
      }
    }
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Supabase bağlanınca burada API çağrısı yapılacak
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    alert(isEdit ? "Ürün güncellendi!" : "Ürün eklendi!");
    router.push("/admin/urunler");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol — ana bilgiler */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Ürün Bilgileri</h3>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Ürün Adı *</label>
                <input required type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} placeholder="Ambra Noir" />
              </div>
              <div>
                <label className={labelCls}>Slug</label>
                <input type="text" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className={inputCls} placeholder="ambra-noir" />
                <p className="text-xs text-[#b8a89e] mt-1">/urunler/{form.slug || "slug"}</p>
              </div>
              <div>
                <label className={labelCls}>Açıklama</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} placeholder="Ürün açıklaması..." />
              </div>
            </div>
          </div>

          {/* Görseller */}
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Görseller</h3>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {images.map((url) => (
                  <div key={url} className="relative aspect-square bg-[#f5f0eb] rounded-sm overflow-hidden group">
                    <Image src={url} alt="ürün görseli" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              className="border-2 border-dashed border-[#d4c5ba] rounded-sm p-8 text-center cursor-pointer hover:border-[#8b6f5e] transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <p className="text-sm text-[#8b6f5e]">Yükleniyor...</p>
              ) : (
                <>
                  <span className="text-3xl text-[#d4c5ba]">◈</span>
                  <p className="text-sm text-[#8b6f5e] mt-2">Görsel yüklemek için tıklayın</p>
                  <p className="text-xs text-[#b8a89e] mt-1">PNG, JPG, WebP — maks. 5MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        {/* Sağ panel */}
        <div className="space-y-6">
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Durum</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[#2c1810]" />
              <span className="text-sm text-[#5c4033]">Aktif (yayında)</span>
            </label>
          </div>

          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Fiyat</h3>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Satış Fiyatı (₺) *</label>
                <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className={inputCls} placeholder="890" />
              </div>
              <div>
                <label className={labelCls}>Eski Fiyat (₺)</label>
                <input type="number" min="0" step="0.01" value={form.comparePrice} onChange={(e) => setForm((p) => ({ ...p, comparePrice: e.target.value }))} className={inputCls} placeholder="1100" />
                <p className="text-xs text-[#b8a89e] mt-1">Üzeri çizili gösterilir</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Kategori</h3>
            <select value={form.categorySlug} onChange={(e) => setForm((p) => ({ ...p, categorySlug: e.target.value }))} className={inputCls}>
              <option value="">Kategori seçin</option>
              {mockCategories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Stok</h3>
            <div>
              <label className={labelCls}>Stok Adedi</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase py-3 hover:bg-[#3d2418] transition-colors disabled:opacity-50">
              {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
            </button>
            <button type="button" onClick={() => router.push("/admin/urunler")} className="px-4 border border-[#d4c5ba] text-[#5c4033] text-xs tracking-wide hover:bg-[#f5f0eb] transition-colors">
              İptal
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
