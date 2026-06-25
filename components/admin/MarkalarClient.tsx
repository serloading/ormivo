"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createBrand, updateBrand, deleteBrand } from "@/lib/actions/brand";

type Brand = { id: string; name: string; slug: string; logo?: string | null; _count?: { products: number } };

function toSlug(text: string) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const inputCls = "w-full border border-[#d4c5ba] rounded-sm px-4 py-3 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] transition-colors bg-[#faf8f6]";
const labelCls = "block text-xs font-medium tracking-widest text-[#5c4033] uppercase mb-2";

export default function MarkalarClient({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", logo: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ name: "", slug: "", logo: "" });
    setShowForm(true);
  }

  function openEdit(b: Brand) {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug, logo: b.logo ?? "" });
    setShowForm(true);
  }

  function handleNameChange(name: string) {
    setForm((p) => ({ ...p, name, slug: editing ? p.slug : toSlug(name) }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "logos");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      setForm((p) => ({ ...p, logo: data.url }));
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data = { name: form.name, slug: form.slug, logo: form.logo || undefined };
    if (editing) {
      await updateBrand(editing.id, data);
    } else {
      await createBrand(data);
    }
    setSaving(false);
    setShowForm(false);
    router.refresh();
  }

  function handleDelete(id: string) {
    if (confirm("Bu marka silinsin mi?")) {
      startTransition(async () => { await deleteBrand(id); router.refresh(); });
    }
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <button onClick={openNew}
          className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
          + Marka Ekle
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-md p-6">
            <h3 className="text-sm tracking-widest text-[#5c4033] uppercase mb-5">{editing ? "Marka Duzenle" : "Yeni Marka"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Marka Adi *</label>
                <input required type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} placeholder="Byredo" />
              </div>
              <div>
                <label className={labelCls}>Slug</label>
                <input type="text" required value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className={inputCls} placeholder="byredo" />
              </div>
              <div>
                <label className={labelCls}>Logo</label>
                {form.logo && (
                  <div className="mb-2 relative w-24 h-16 bg-[#f5f0eb] rounded-sm overflow-hidden border border-[#e8ddd6]">
                    <Image src={form.logo} alt="logo" fill className="object-contain p-2" />
                  </div>
                )}
                <label className="flex items-center gap-3 cursor-pointer border border-dashed border-[#d4c5ba] rounded-sm px-4 py-3 hover:border-[#8b6f5e] transition-colors">
                  <span className="text-xs text-[#8b6f5e]">{uploading ? "Yukleniyor..." : form.logo ? "Degistir" : "Logo Yukle"}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <p className="text-xs text-[#b8a89e] mt-1">PNG, SVG, WebP — Logo public/logos/ klasorune atilacak</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase py-3 hover:bg-[#3d2418] transition-colors disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : editing ? "Guncelle" : "Kaydet"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 border border-[#d4c5ba] text-[#5c4033] text-xs hover:bg-[#f5f0eb] transition-colors">
                  Iptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        {brands.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#b8a89e]">Henuz marka eklenmemis.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
                {["Logo", "Marka", "Slug", "Urun Sayisi", ""].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brands.map((b, i) => (
                <tr key={b.id} className={"border-b border-[#f0ebe6] hover:bg-[#faf8f6] transition-colors " + (i === brands.length - 1 ? "border-b-0" : "")}>
                  <td className="px-6 py-4">
                    {b.logo ? (
                      <div className="relative w-16 h-10 bg-[#f5f0eb] rounded-sm overflow-hidden">
                        <Image src={b.logo} alt={b.name} fill className="object-contain p-1" />
                      </div>
                    ) : (
                      <div className="w-16 h-10 bg-[#f5f0eb] rounded-sm flex items-center justify-center text-[#d4c5ba] text-xs">—</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-[#2c1810]">{b.name}</td>
                  <td className="px-6 py-4 text-[#8b6f5e] text-xs">{b.slug}</td>
                  <td className="px-6 py-4 text-[#5c4033] font-medium">{b._count?.products ?? 0} ürün</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(b)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810] transition-colors mr-4">Duzenle</button>
                    <button onClick={() => handleDelete(b.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
