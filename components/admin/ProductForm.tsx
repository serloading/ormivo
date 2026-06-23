"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createProduct, updateProduct } from "@/lib/actions/product";

type Category = { id: string; name: string; slug: string };
type Brand = { id: string; name: string; slug: string; logo?: string | null };
type Product = {
  id: string; name: string; slug: string; description?: string | null;
  price: number | string; comparePrice?: number | string | null;
  costPrice?: number | string | null; costPriceUsd?: number | string | null;
  stock: number; isActive: boolean; isOzelKoleksiyon?: boolean; images: string[];
  categoryId?: string | null; brandId?: string | null;
};

type Props = { product?: Product; categories: Category[]; brands: Brand[] };

function toSlug(text: string) {
  return text.toLowerCase()
    .replace(/g/g, "g").replace(/u/g, "u").replace(/s/g, "s")
    .replace(/i/g, "i").replace(/o/g, "o").replace(/c/g, "c")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const inputCls = "w-full border border-[#d4c5ba] rounded-sm px-4 py-3 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] transition-colors bg-[#faf8f6]";
const labelCls = "block text-xs font-medium tracking-widest text-[#5c4033] uppercase mb-2";

export default function ProductForm({ product, categories, brands }: Props) {
  const router = useRouter();
  const isEdit = !!product;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product?.price?.toString() ?? "",
    comparePrice: product?.comparePrice?.toString() ?? "",
    costPrice: product?.costPrice?.toString() ?? "",
    costPriceUsd: product?.costPriceUsd?.toString() ?? "",
    categoryId: product?.categoryId ?? "",
    brandId: product?.brandId ?? "",
    stock: product?.stock?.toString() ?? "0",
    isActive: product?.isActive ?? true,
    isOzelKoleksiyon: product?.isOzelKoleksiyon ?? false,
  });

  const [costCurrency, setCostCurrency] = useState<"TRY" | "USD">("TRY");
  const [usdRate, setUsdRate] = useState("38");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleNameChange(name: string) {
    setForm((p) => ({ ...p, name, slug: isEdit ? p.slug : toSlug(name) }));
  }

  function handleUsdChange(usd: string) {
    setForm((p) => ({
      ...p,
      costPriceUsd: usd,
      costPrice: usd && usdRate ? String(Math.round(parseFloat(usd) * parseFloat(usdRate))) : p.costPrice,
    }));
  }

  function handleRateChange(rate: string) {
    setUsdRate(rate);
    if (form.costPriceUsd && rate) {
      setForm((p) => ({ ...p, costPrice: String(Math.round(parseFloat(p.costPriceUsd) * parseFloat(rate))) }));
    }
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
      price: parseFloat(form.price) || 0,
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
      costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
      costPriceUsd: form.costPriceUsd ? parseFloat(form.costPriceUsd) : undefined,
      categoryId: form.categoryId || undefined,
      brandId: form.brandId || undefined,
      stock: parseInt(form.stock) || 0,
      isActive: form.isActive,
      isOzelKoleksiyon: form.isOzelKoleksiyon,
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
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Gelis Fiyati</h3>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setCostCurrency("TRY")}
                className={"flex-1 text-xs py-1.5 rounded-sm border transition-colors " + (costCurrency === "TRY" ? "bg-[#2c1810] text-[#f5f0eb] border-[#2c1810]" : "border-[#d4c5ba] text-[#5c4033]")}>
                TL TRY
              </button>
              <button type="button" onClick={() => setCostCurrency("USD")}
                className={"flex-1 text-xs py-1.5 rounded-sm border transition-colors " + (costCurrency === "USD" ? "bg-[#2c1810] text-[#f5f0eb] border-[#2c1810]" : "border-[#d4c5ba] text-[#5c4033]")}>
                $ USD
              </button>
            </div>
            {costCurrency === "USD" ? (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Dolar Kuru (TL)</label>
                  <input type="number" min="0" step="0.01" value={usdRate} onChange={(e) => handleRateChange(e.target.value)} className={inputCls} placeholder="38" />
                </div>
                <div>
                  <label className={labelCls}>Gelis Fiyati ($)</label>
                  <input type="number" min="0" step="0.01" value={form.costPriceUsd} onChange={(e) => handleUsdChange(e.target.value)} className={inputCls} placeholder="25" />
                </div>
                <div>
                  <label className={labelCls}>= TRY Karsiligi</label>
                  <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))} className={inputCls} placeholder="Otomatik hesaplanir" />
                  <p className="text-xs text-[#b8a89e] mt-1">Elle degistirebilirsiniz</p>
                </div>
              </div>
            ) : (
              <div>
                <label className={labelCls}>Gelis Fiyati (TL)</label>
                <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))} className={inputCls} placeholder="750" />
              </div>
            )}
          </div>

          <div className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-5">Kategori</h3>
            <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} className={inputCls}>
              <option value="">Kategori secin</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
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
