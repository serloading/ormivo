"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createProduct, updateProduct } from "@/lib/actions/product";

type Category = { id: string; name: string; slug: string };
type Brand = { id: string; name: string; slug: string; logo?: string | null };
type Product = {
  id: string; name: string; slug: string; description?: string | null;
  scentNotes?: string | null;
  price: number | string; comparePrice?: number | string | null;
  costPrice?: number | string | null; costPriceUsd?: number | string | null;
  stock: number; isActive: boolean; isOzelKoleksiyon?: boolean; isBestSeller?: boolean; isNew?: boolean; images: string[];
  categoryId?: string | null; extraCategoryIds?: string[]; brandId?: string | null;
};

type Props = { product?: Product; categories: Category[]; brands: Brand[]; usdRate?: number };

function toSlug(text: string) {
  return text.toLowerCase()
    .replace(/g/g, "g").replace(/u/g, "u").replace(/s/g, "s")
    .replace(/i/g, "i").replace(/o/g, "o").replace(/c/g, "c")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const inputCls = "w-full border border-[#d4c5ba] rounded-sm px-4 py-3 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] transition-colors bg-[#faf8f6]";
const labelCls = "block text-xs font-medium tracking-widest text-[#5c4033] uppercase mb-2";

export default function ProductForm({ product, categories, brands, usdRate = 38 }: Props) {
  const router = useRouter();
  const isEdit = !!product;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    scentNotes: product?.scentNotes ?? "",
    price: product?.price?.toString() ?? "",
    comparePrice: product?.comparePrice?.toString() ?? "",
    costPrice: product?.costPrice?.toString() ?? "",
    costPriceUsd: product?.costPriceUsd?.toString() ?? "",
    brandId: product?.brandId ?? "",
    stock: product?.stock?.toString() ?? "0",
    isActive: product?.isActive ?? true,
    isOzelKoleksiyon: product?.isOzelKoleksiyon ?? false,
    isBestSeller: product?.isBestSeller ?? false,
    isNew: product?.isNew ?? false,
  });

  // Çoklu kategori: primary + extra birleştir, primary ilk sırada
  const initCatIds = Array.from(new Set([
    ...(product?.categoryId ? [product.categoryId] : []),
    ...(product?.extraCategoryIds ?? []),
  ]));
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(initCatIds);

  function toggleCat(id: string) {
    setSelectedCatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

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
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      scentNotes: form.scentNotes || undefined,
      price: parseFloat(form.price) || 0,
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
      costPrice: null,
      costPriceUsd: form.costPriceUsd ? parseFloat(form.costPriceUsd) : undefined,
      categoryId: selectedCatIds[0] || undefined,
      extraCategoryIds: selectedCatIds.slice(1),
      brandId: form.brandId || undefined,
      stock: parseInt(form.stock) || 0,
      isActive: form.isActive,
      isOzelKoleksiyon: form.isOzelKoleksiyon,
      isBestSeller: form.isBestSeller,
      isNew: form.isNew,
      images,
    };
    if (isEdit && product) {
      await updateProduct(product.id, payload);
    } else {
      await createProduct(payload);
    }
    setSaving(false);
    router.push("/admin/urunler");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Urun Bilgileri</h3>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Urun Adi *</label>
                <input required type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} placeholder="Ambra Noir" />
              </div>
              <div>
                <label className={labelCls}>Slug</label>
                <input type="text" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className={inputCls} placeholder="ambra-noir" />
                <p className="text-xs text-[#b8a89e] mt-1">/urunler/{form.slug || "slug"}</p>
              </div>
              <div>
                <label className={labelCls}>Aciklama</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} placeholder="Urun aciklamasi..." />
              </div>
              <div>
                <label className={labelCls}>Koku Notaları</label>
                <textarea rows={3} value={form.scentNotes} onChange={(e) => setForm((p) => ({ ...p, scentNotes: e.target.value }))} className={inputCls} placeholder="Üst nota: Bergamot, Limon&#10;Orta nota: Gül, Yasemin&#10;Dip nota: Misk, Amber" />
                <p className="text-xs text-[#b8a89e] mt-1">Ürün sayfasında gösterilir</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Gorseller</h3>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {images.map((url) => (
                  <div key={url} className="relative aspect-square bg-[#f5f0eb] rounded-sm overflow-hidden group">
                    <Image src={url} alt="urun gorseli" fill className="object-cover" />
                    <button type="button" onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-2 border-dashed border-[#d4c5ba] rounded-sm p-8 text-center cursor-pointer hover:border-[#8b6f5e] transition-colors" onClick={() => fileRef.current?.click()}>
              {uploading ? (
                <p className="text-sm text-[#8b6f5e]">Yukleniyor...</p>
              ) : (
                <>
                  <span className="text-3xl text-[#d4c5ba]">+</span>
                  <p className="text-sm text-[#8b6f5e] mt-2">Gorsel yuklemek icin tiklayin</p>
                  <p className="text-xs text-[#b8a89e] mt-1">PNG, JPG, WebP max 5MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Durum</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[#2c1810]" />
                <span className="text-sm text-[#5c4033]">Aktif (yayinda)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isOzelKoleksiyon} onChange={(e) => setForm((p) => ({ ...p, isOzelKoleksiyon: e.target.checked }))} className="w-4 h-4 accent-[#2c1810]" />
                <span className="text-sm text-[#5c4033]">Özel Koleksiyon</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isBestSeller} onChange={(e) => setForm((p) => ({ ...p, isBestSeller: e.target.checked }))} className="w-4 h-4 accent-[#2c1810]" />
                <span className="text-sm text-[#5c4033]">En Çok Satan</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isNew} onChange={(e) => setForm((p) => ({ ...p, isNew: e.target.checked }))} className="w-4 h-4 accent-[#2c1810]" />
                <span className="text-sm text-[#5c4033]">Yeni Ürün (Yeni Gelenler&apos;de göster)</span>
              </label>
            </div>
          </div>

          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Fiyat</h3>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Satis Fiyati (TL) *</label>
                <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className={inputCls} placeholder="890" />
              </div>
              <div>
                <label className={labelCls}>Eski Fiyat (TL)</label>
                <input type="number" min="0" step="0.01" value={form.comparePrice} onChange={(e) => setForm((p) => ({ ...p, comparePrice: e.target.value }))} className={inputCls} placeholder="1100" />
                <p className="text-xs text-[#b8a89e] mt-1">Uzeri cizili gosterilir</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-1">Gelis Fiyati (USD)</h3>
            <p className="text-[11px] text-[#b8a89e] mb-4">
              Sistem kuru: <strong className="text-[#5c4033]">{usdRate} TL</strong> — kuru Ürünler sayfasından değiştirebilirsiniz
            </p>
            <div>
              <label className={labelCls}>Gelis Fiyati ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.costPriceUsd}
                onChange={(e) => setForm((p) => ({ ...p, costPriceUsd: e.target.value }))}
                className={inputCls} placeholder="25"
              />
              {form.costPriceUsd && (
                <p className="text-xs text-[#8b6f5e] mt-2">
                  ≈ {Math.round(parseFloat(form.costPriceUsd) * usdRate).toLocaleString("tr-TR")} TL
                  <span className="text-[#b8a89e] ml-1">(siparişte o anki kur ile hesaplanır)</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">
              Kategoriler
              <span className="ml-2 font-normal normal-case text-[#b8a89e]">(birden fazla seçilebilir)</span>
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCatIds.includes(cat.id)}
                    onChange={() => toggleCat(cat.id)}
                    className="w-4 h-4 accent-[#8b6f5e]"
                  />
                  <span className="text-sm text-[#2c1810] group-hover:text-[#8b6f5e] transition-colors">
                    {cat.name}
                  </span>
                  {selectedCatIds[0] === cat.id && (
                    <span className="text-[10px] bg-[#f5f0eb] text-[#8b6f5e] px-1.5 py-0.5 rounded">Ana</span>
                  )}
                </label>
              ))}
            </div>
            {selectedCatIds.length === 0 && (
              <p className="text-xs text-[#b8a89e] mt-2">En az bir kategori seçin.</p>
            )}
          </div>

          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Marka</h3>
            <select value={form.brandId} onChange={(e) => setForm((p) => ({ ...p, brandId: e.target.value }))} className={inputCls}>
              <option value="">Marka secin</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
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
            <button type="submit" disabled={saving}
              className="flex-1 bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase py-3 hover:bg-[#3d2418] transition-colors disabled:opacity-50">
              {saving ? "Kaydediliyor..." : isEdit ? "Guncelle" : "Kaydet"}
            </button>
            <button type="button" onClick={() => router.push("/admin/urunler")}
              className="px-4 border border-[#d4c5ba] text-[#5c4033] text-xs tracking-wide hover:bg-[#f5f0eb] transition-colors">
              Iptal
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
