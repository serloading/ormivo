"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  toggleProductActive, deleteProduct, backfillProductNos,
  updateProduct, bulkUpdateProducts, updateProductImages,
} from "@/lib/actions/product";

type Category = { id: string; name: string; slug: string };
type Brand    = { id: string; name: string; slug: string };
type Product  = {
  id: string; productNo?: string | null; name: string; slug: string;
  price: number | string; comparePrice?: number | string | null;
  costPrice?: number | string | null; stock: number; isActive: boolean;
  images: string[];
  category?: Category | null;
  brand?: Brand | null;
  extraCategoryIds?: string[];
};

type EditCell = { id: string; field: string } | null;

export default function AdminUrunlerClient({
  products: initialProducts, categories, brands,
}: { products: Product[]; categories: Category[]; brands: Brand[] }) {
  const [, startTransition] = useTransition();

  // Local products state — updated optimistically after each mutation
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [search,   setSearch]   = useState("");
  const [kategori, setKategori] = useState("");
  const [marka,    setMarka]    = useState("");
  const [durum,    setDurum]    = useState("");
  const [stokSort, setStokSort] = useState("");

  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [bulkField,  setBulkField]  = useState("price");
  const [bulkValue,  setBulkValue]  = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const [editCell,  setEditCell]  = useState<EditCell>(null);
  const [editValue, setEditValue] = useState("");
  const [saving,    setSaving]    = useState(false);
  const editRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const [photoModal, setPhotoModal] = useState<Product | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const photoFileRef = useRef<HTMLInputElement>(null);

  /* ── Local state helpers ───────────────────── */
  function patchProduct(id: string, patch: Partial<Product>) {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
    setPhotoModal((prev) => prev?.id === id ? { ...prev, ...patch } : prev);
  }
  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  /* ── Filtering ─────────────────────────────── */
  const filtered = products
    .filter((p) => {
      const s = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.slug ?? "").includes(search.toLowerCase());
      const k = !kategori || p.category?.slug === kategori ||
                (p.extraCategoryIds ?? []).some((eid) => categories.find((c) => c.id === eid)?.slug === kategori);
      const m = !marka || p.brand?.slug === marka;
      const d = durum === "" ? true : durum === "aktif" ? p.isActive : !p.isActive;
      return s && k && m && d;
    })
    .sort((a, b) => {
      if (stokSort === "artan")  return a.stock - b.stock;
      if (stokSort === "azalan") return b.stock - a.stock;
      return 0;
    });

  /* ── Inline edit ───────────────────────────── */
  function startEdit(product: Product, field: string) {
    let val = "";
    if (field === "price")      val = String(Number(product.price));
    if (field === "costPrice")  val = String(Number(product.costPrice ?? 0));
    if (field === "stock")      val = String(product.stock);
    if (field === "name")       val = product.name;
    if (field === "slug")       val = product.slug;
    if (field === "brandId")    val = product.brand?.id ?? "";
    if (field === "categoryId") val = product.category?.id ?? "";
    setEditCell({ id: product.id, field });
    setEditValue(val);
    setTimeout(() => (editRef.current as HTMLElement | null)?.focus(), 50);
  }

  function cancelEdit() { setEditCell(null); setEditValue(""); }

  async function commitEdit(overrideValue?: string) {
    if (!editCell || saving) return;
    const id    = editCell.id;
    const field = editCell.field;
    const val   = overrideValue ?? editValue;

    // Build data + optimistic patch
    let data: Record<string, unknown> = {};
    let patch: Partial<Product> = {};

    if (field === "price") {
      const n = parseFloat(val) || 0;
      data = { price: n }; patch = { price: n };
    }
    if (field === "costPrice") {
      const n = parseFloat(val) || 0;
      data = { costPrice: n }; patch = { costPrice: n };
    }
    if (field === "stock") {
      const n = parseInt(val) || 0;
      data = { stock: n }; patch = { stock: n };
    }
    if (field === "name") {
      data = { name: val }; patch = { name: val };
    }
    if (field === "slug") {
      const slug = val.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      data = { slug }; patch = { slug };
    }
    if (field === "brandId") {
      const brand = brands.find((b) => b.id === val) ?? null;
      data = { brandId: val || undefined }; patch = { brand };
    }
    if (field === "categoryId") {
      const category = categories.find((c) => c.id === val) ?? null;
      data = { categoryId: val || undefined }; patch = { category };
    }

    setEditCell(null);
    setEditValue("");
    patchProduct(id, patch);   // optimistic update — instant UI
    setSaving(true);
    try {
      await updateProduct(id, data as never);
    } catch {
      // revert on error — ideally we'd restore old value but keep simple
    } finally {
      setSaving(false);
    }
  }

  /* ── Bulk ──────────────────────────────────── */
  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  }
  async function applyBulk() {
    if (!bulkValue || selected.size === 0) return;
    const ids = Array.from(selected);
    let data: Record<string, unknown> = {};
    let patch: Partial<Product> = {};
    if (bulkField === "price")      { const n = parseFloat(bulkValue)||0; data={price:n}; patch={price:n}; }
    if (bulkField === "costPrice")  { const n = parseFloat(bulkValue)||0; data={costPrice:n}; patch={costPrice:n}; }
    if (bulkField === "stock")      { const n = parseInt(bulkValue)||0; data={stock:n}; patch={stock:n}; }
    if (bulkField === "isActive")   { const v = bulkValue==="true"; data={isActive:v}; patch={isActive:v}; }
    if (bulkField === "brandId")    { const brand=brands.find((b)=>b.id===bulkValue)??null; data={brandId:bulkValue}; patch={brand}; }
    if (bulkField === "categoryId") { const category=categories.find((c)=>c.id===bulkValue)??null; data={categoryId:bulkValue}; patch={category}; }

    // Optimistic
    setProducts((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, ...patch } : p));
    setSelected(new Set());
    setBulkValue("");
    setBulkSaving(true);
    try { await bulkUpdateProducts(ids, data as never); }
    finally { setBulkSaving(false); }
  }

  /* ── Photo ─────────────────────────────────── */
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!photoModal || !e.target.files?.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string };
      if (json.url) newUrls.push(json.url);
    }
    const updated = [...(photoModal.images ?? []), ...newUrls];
    await updateProductImages(photoModal.id, updated);
    patchProduct(photoModal.id, { images: updated });
    setUploading(false);
  }
  async function removePhoto(url: string) {
    if (!photoModal) return;
    const updated = photoModal.images.filter((u) => u !== url);
    await updateProductImages(photoModal.id, updated);
    patchProduct(photoModal.id, { images: updated });
  }

  function handleToggle(id: string, current: boolean) {
    const next = !current;
    patchProduct(id, { isActive: next });   // instant
    startTransition(async () => { await toggleProductActive(id, next); });
  }

  function handleDelete(id: string) {
    if (confirm("Bu ürün silinsin mi?")) {
      removeProduct(id);
      startTransition(async () => { await deleteProduct(id); });
    }
  }

  async function handleBackfill() {
    await backfillProductNos();
    // reload to show new numbers
    window.location.reload();
  }

  const isEditing = (id: string, field: string) => editCell?.id === id && editCell.field === field;

  return (
    <>
      {/* Toolbar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleBackfill}
          className="border border-[#d4c5ba] text-[#8b6f5e] text-xs tracking-widest uppercase px-4 py-2 hover:bg-[#f5f0eb] transition-colors"
        >
          Numara Ata
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e8ddd6] rounded-sm p-4 mb-6 flex flex-wrap gap-3">
        <input type="text" placeholder="Ürün ara..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]" />
        <select value={kategori} onChange={(e) => setKategori(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tüm Kategoriler</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={marka} onChange={(e) => setMarka(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tüm Markalar</option>
          {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
        </select>
        <select value={durum} onChange={(e) => setDurum(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tüm Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="pasif">Pasif</option>
        </select>
        <select value={stokSort} onChange={(e) => setStokSort(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Varsayılan Sıra</option>
          <option value="artan">Stok: Az → Çok</option>
          <option value="azalan">Stok: Çok → Az</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
                <th className="px-3 py-3 text-left">
                  <input type="checkbox"
                    checked={selected.size > 0 && selected.size === filtered.length}
                    onChange={toggleAll}
                    className="accent-[#8b6f5e] cursor-pointer" />
                </th>
                <th className="px-4 py-3 text-left text-xs tracking-widest uppercase text-[#8b6f5e] font-normal whitespace-nowrap">No</th>
                <th className="px-4 py-3 text-left text-xs tracking-widest uppercase text-[#8b6f5e] font-normal">Ürün</th>
                <th className="px-4 py-3 text-left text-xs tracking-widest uppercase text-[#8b6f5e] font-normal">Marka</th>
                <th className="px-4 py-3 text-left text-xs tracking-widest uppercase text-[#8b6f5e] font-normal">Kategori</th>
                <th className="px-4 py-3 text-left text-xs tracking-widest uppercase text-[#8b6f5e] font-normal whitespace-nowrap">Satış ₺</th>
                <th className="px-4 py-3 text-left text-xs tracking-widest uppercase text-[#8b6f5e] font-normal whitespace-nowrap">Geliş ₺</th>
                <th className="px-4 py-3 text-left text-xs tracking-widest uppercase text-[#8b6f5e] font-normal">Stok</th>
                <th className="px-4 py-3 text-left text-xs tracking-widest uppercase text-[#8b6f5e] font-normal">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-[#b8a89e] text-sm">Ürün bulunamadı</td></tr>
              ) : filtered.map((product, i) => {
                const isSelected = selected.has(product.id);
                const thumb = product.images?.[0] ?? null;
                const extraCats = (product.extraCategoryIds ?? []).filter((eid) => categories.some((c) => c.id === eid));

                return (
                  <tr key={product.id}
                    className={"border-b border-[#f0e8e0] hover:bg-[#fdfcfb] transition-colors" +
                      (isSelected ? " bg-[#faf3eb]" : "") +
                      (i === filtered.length - 1 ? " border-b-0" : "")}>

                    <td className="px-3 py-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.id)}
                        className="accent-[#8b6f5e] cursor-pointer" />
                    </td>

                    <td className="px-4 py-3 text-xs text-[#b8a89e] font-mono whitespace-nowrap">{product.productNo ?? "—"}</td>

                    {/* Ürün adı + slug + thumbnail */}
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => setPhotoModal(product)}
                          className="relative w-10 h-10 bg-[#f5f0eb] border border-[#e8ddd6] rounded cursor-pointer hover:border-[#8b6f5e] shrink-0 overflow-hidden"
                          title="Fotoğrafı değiştir"
                        >
                          {thumb ? (
                            <Image src={thumb} alt={product.name} fill className="object-contain p-0.5" sizes="40px" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-[#d4c5ba] text-lg">+</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          {isEditing(product.id, "name") ? (
                            <input
                              ref={editRef as React.RefObject<HTMLInputElement>}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => commitEdit()}
                              onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                              className="border border-[#8b6f5e] rounded px-2 py-1 text-sm w-48 focus:outline-none"
                              disabled={saving}
                            />
                          ) : (
                            <div className="flex items-center gap-1 group/name">
                              <span
                                onClick={() => startEdit(product, "name")}
                                title="Düzenlemek için tıkla"
                                className="font-medium text-[#2c1810] cursor-pointer hover:text-[#8b6f5e] truncate max-w-[185px] block"
                              >
                                {product.name}
                              </span>
                              <a
                                href={`/urunler/${product.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Sitede görüntüle"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#d4c5ba] hover:text-[#8b6f5e] opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0"
                              >↗</a>
                            </div>
                          )}
                          {isEditing(product.id, "slug") ? (
                            <input
                              ref={editRef as React.RefObject<HTMLInputElement>}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => commitEdit()}
                              onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                              className="border border-[#8b6f5e] rounded px-2 py-0.5 text-xs w-44 focus:outline-none mt-0.5"
                              disabled={saving}
                            />
                          ) : (
                            <p
                              onClick={() => startEdit(product, "slug")}
                              title="Slug düzenlemek için tıkla"
                              className="text-xs text-[#b8a89e] mt-0.5 truncate max-w-[200px] cursor-pointer hover:text-[#8b6f5e] transition-colors"
                            >
                              /{product.slug}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Marka */}
                    <td className="px-4 py-3 text-[#5c4033]">
                      {isEditing(product.id, "brandId") ? (
                        <select
                          ref={editRef as React.RefObject<HTMLSelectElement>}
                          value={editValue}
                          onChange={(e) => { const v = e.target.value; setEditValue(v); commitEdit(v); }}
                          onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                          className="border border-[#8b6f5e] rounded px-2 py-1 text-xs focus:outline-none bg-white"
                          disabled={saving}
                        >
                          <option value="">—</option>
                          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      ) : (
                        <span
                          onClick={() => startEdit(product, "brandId")}
                          title="Düzenlemek için tıkla"
                          className="cursor-pointer hover:bg-[#f5f0eb] px-1 py-0.5 rounded transition-colors text-xs"
                        >
                          {product.brand?.name ?? "—"}
                        </span>
                      )}
                    </td>

                    {/* Kategori */}
                    <td className="px-4 py-3 text-[#5c4033]">
                      {isEditing(product.id, "categoryId") ? (
                        <select
                          ref={editRef as React.RefObject<HTMLSelectElement>}
                          value={editValue}
                          onChange={(e) => { const v = e.target.value; setEditValue(v); commitEdit(v); }}
                          onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                          className="border border-[#8b6f5e] rounded px-2 py-1 text-xs focus:outline-none bg-white"
                          disabled={saving}
                        >
                          <option value="">—</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <span
                          onClick={() => startEdit(product, "categoryId")}
                          title="Düzenlemek için tıkla"
                          className="cursor-pointer hover:bg-[#f5f0eb] px-1 py-0.5 rounded transition-colors text-xs"
                        >
                          {product.category?.name ?? "—"}
                          {extraCats.length > 0 && <span className="ml-1 text-[10px] text-[#b8a89e]">+{extraCats.length}</span>}
                        </span>
                      )}
                    </td>

                    {/* Satış fiyatı */}
                    <td className="px-4 py-3">
                      {isEditing(product.id, "price") ? (
                        <input
                          ref={editRef as React.RefObject<HTMLInputElement>}
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit()}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                          className="w-24 border border-[#8b6f5e] rounded px-2 py-1 text-sm focus:outline-none text-[#2c1810] font-medium"
                          disabled={saving}
                        />
                      ) : (
                        <span
                          onClick={() => startEdit(product, "price")}
                          title="Düzenlemek için tıkla"
                          className="cursor-pointer hover:bg-[#f5f0eb] px-1 py-0.5 rounded transition-colors text-[#2c1810] font-medium"
                        >
                          {Number(product.price).toLocaleString("tr-TR")} ₺
                        </span>
                      )}
                    </td>

                    {/* Geliş fiyatı */}
                    <td className="px-4 py-3">
                      {isEditing(product.id, "costPrice") ? (
                        <input
                          ref={editRef as React.RefObject<HTMLInputElement>}
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit()}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                          className="w-24 border border-[#8b6f5e] rounded px-2 py-1 text-sm focus:outline-none text-[#8b6f5e]"
                          disabled={saving}
                        />
                      ) : (
                        <span
                          onClick={() => startEdit(product, "costPrice")}
                          title="Düzenlemek için tıkla"
                          className="cursor-pointer hover:bg-[#f5f0eb] px-1 py-0.5 rounded transition-colors text-[#8b6f5e] text-xs"
                        >
                          {product.costPrice ? `${Number(product.costPrice).toLocaleString("tr-TR")} ₺` : "—"}
                        </span>
                      )}
                    </td>

                    {/* Stok */}
                    <td className="px-4 py-3">
                      {isEditing(product.id, "stock") ? (
                        <input
                          ref={editRef as React.RefObject<HTMLInputElement>}
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit()}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                          className={`w-20 border border-[#8b6f5e] rounded px-2 py-1 text-sm focus:outline-none ${product.stock === 0 ? "text-red-600" : product.stock <= 2 ? "text-orange-500" : "text-[#5c4033]"}`}
                          disabled={saving}
                        />
                      ) : (
                        <span
                          onClick={() => startEdit(product, "stock")}
                          title="Düzenlemek için tıkla"
                          className={`cursor-pointer hover:bg-[#f5f0eb] px-1 py-0.5 rounded transition-colors ${product.stock === 0 ? "text-red-600 font-medium" : product.stock <= 2 ? "text-orange-500 font-medium" : "text-[#5c4033]"}`}
                        >
                          {product.stock}
                          {product.stock === 0 && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Tükendi</span>}
                          {product.stock > 0 && product.stock <= 2 && <span className="ml-1 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">⚠</span>}
                        </span>
                      )}
                    </td>

                    {/* Durum */}
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(product.id, product.isActive)}
                        className={"text-xs px-3 py-1 rounded-full transition-colors " +
                          (product.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                        {product.isActive ? "Aktif" : "Pasif"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/admin/urunler/${product.id}/duzenle`}
                        className="text-xs text-[#8b6f5e] hover:text-[#2c1810] transition-colors mr-4">Düzenle</Link>
                      <button onClick={() => handleDelete(product.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors">Sil</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk edit bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#2c1810] text-[#f5f0eb] px-6 py-4 flex flex-wrap items-center gap-4 shadow-2xl">
          <span className="text-sm font-medium shrink-0">{selected.size} ürün seçildi</span>
          <select value={bulkField} onChange={(e) => { setBulkField(e.target.value); setBulkValue(""); }}
            className="bg-[#3d2418] border border-[#5c4033] rounded px-3 py-2 text-sm text-[#f5f0eb] focus:outline-none">
            <option value="price">Satış Fiyatı</option>
            <option value="costPrice">Geliş Fiyatı</option>
            <option value="stock">Stok</option>
            <option value="isActive">Durum</option>
            <option value="brandId">Marka</option>
            <option value="categoryId">Kategori</option>
          </select>
          {(bulkField === "price" || bulkField === "costPrice" || bulkField === "stock") && (
            <input type="number" placeholder="Değer girin" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
              className="bg-[#3d2418] border border-[#5c4033] rounded px-3 py-2 text-sm text-[#f5f0eb] placeholder-[#8b6f5e] w-36 focus:outline-none" />
          )}
          {bulkField === "isActive" && (
            <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
              className="bg-[#3d2418] border border-[#5c4033] rounded px-3 py-2 text-sm text-[#f5f0eb] focus:outline-none">
              <option value="">Seç...</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          )}
          {bulkField === "brandId" && (
            <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
              className="bg-[#3d2418] border border-[#5c4033] rounded px-3 py-2 text-sm text-[#f5f0eb] focus:outline-none">
              <option value="">Seç...</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {bulkField === "categoryId" && (
            <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
              className="bg-[#3d2418] border border-[#5c4033] rounded px-3 py-2 text-sm text-[#f5f0eb] focus:outline-none">
              <option value="">Seç...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button onClick={applyBulk} disabled={!bulkValue || bulkSaving}
            className="bg-[#f5f0eb] text-[#2c1810] text-xs tracking-widest uppercase px-5 py-2 rounded hover:bg-white transition-colors disabled:opacity-40">
            {bulkSaving ? "Kaydediliyor..." : "Uygula"}
          </button>
          <button onClick={() => setSelected(new Set())}
            className="text-xs text-[#b8a89e] hover:text-[#f5f0eb] ml-auto transition-colors">
            İptal
          </button>
        </div>
      )}

      {/* Photo modal */}
      {photoModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setPhotoModal(null)}>
          <div className="bg-white w-full max-w-lg rounded shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-[#8b6f5e] tracking-widest uppercase mb-1">Ürün Fotoğrafları</p>
                <p className="text-sm font-medium text-[#2c1810] truncate max-w-[300px]">{photoModal.name}</p>
              </div>
              <button onClick={() => setPhotoModal(null)} className="text-[#8b6f5e] hover:text-[#2c1810] text-xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {(photoModal.images ?? []).map((url, idx) => (
                <div key={url} className="relative group">
                  <div className="relative aspect-square bg-[#f5f0eb] rounded overflow-hidden">
                    <Image src={url} alt="" fill className="object-contain p-1" sizes="100px" />
                  </div>
                  <button
                    onClick={() => removePhoto(url)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >×</button>
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-black/40 text-white py-0.5">Ana</span>
                  )}
                </div>
              ))}
              {(photoModal.images ?? []).length === 0 && (
                <p className="col-span-4 text-xs text-[#b8a89e] text-center py-4">Henüz fotoğraf yok</p>
              )}
            </div>
            <input ref={photoFileRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            <button
              onClick={() => photoFileRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-[#d4c5ba] rounded py-4 text-sm text-[#8b6f5e] hover:border-[#8b6f5e] hover:text-[#2c1810] transition-colors disabled:opacity-50"
            >
              {uploading ? "Yükleniyor..." : "+ Fotoğraf Ekle"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
