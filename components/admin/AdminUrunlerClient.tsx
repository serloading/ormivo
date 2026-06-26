"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
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
  products, categories, brands,
}: { products: Product[]; categories: Category[]; brands: Brand[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Filters
  const [search,   setSearch]   = useState("");
  const [kategori, setKategori] = useState("");
  const [marka,    setMarka]    = useState("");
  const [durum,    setDurum]    = useState("");
  const [stokSort, setStokSort] = useState("");

  // Bulk select
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkField,   setBulkField]   = useState("price");
  const [bulkValue,   setBulkValue]   = useState("");
  const [bulkSaving,  setBulkSaving]  = useState(false);

  // Inline edit
  const [editCell,   setEditCell]   = useState<EditCell>(null);
  const [editValue,  setEditValue]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const editRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  // Photo modal
  const [photoModal, setPhotoModal] = useState<Product | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const photoFileRef = useRef<HTMLInputElement>(null);

  /* ── Filtering ───────────────────────────── */
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

  /* ── Inline edit helpers ─────────────────── */
  function startEdit(product: Product, field: string) {
    let val = "";
    if (field === "price")     val = String(Number(product.price));
    if (field === "costPrice") val = String(Number(product.costPrice ?? 0));
    if (field === "stock")     val = String(product.stock);
    if (field === "name")      val = product.name;
    if (field === "slug")      val = product.slug;
    if (field === "brandId")   val = product.brand?.id ?? "";
    if (field === "categoryId") val = product.category?.id ?? "";
    setEditCell({ id: product.id, field });
    setEditValue(val);
    setTimeout(() => (editRef.current as HTMLElement | null)?.focus(), 50);
  }

  function cancelEdit() { setEditCell(null); setEditValue(""); }

  async function commitEdit(overrideValue?: string) {
    if (!editCell || saving) return;
    setSaving(true);
    const field = editCell.field;
    const val   = overrideValue ?? editValue;
    let data: Record<string, unknown> = {};
    if (field === "price")     data = { price: parseFloat(val) || 0 };
    if (field === "costPrice") data = { costPrice: parseFloat(val) || 0 };
    if (field === "stock")     data = { stock: parseInt(val) || 0 };
    if (field === "name")      data = { name: val };
    if (field === "slug")      data = { slug: val.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") };
    if (field === "brandId")   data = { brandId: val || undefined };
    if (field === "categoryId") data = { categoryId: val || undefined };
    await updateProduct(editCell.id, data as never);
    setSaving(false);
    setEditCell(null);
    setEditValue("");
    router.refresh();
  }

  /* ── Bulk actions ────────────────────────── */
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  }

  async function applyBulk() {
    if (!bulkValue || selected.size === 0) return;
    setBulkSaving(true);
    const ids = Array.from(selected);
    let data: Record<string, unknown> = {};
    if (bulkField === "price")    data = { price: parseFloat(bulkValue) || 0 };
    if (bulkField === "costPrice") data = { costPrice: parseFloat(bulkValue) || 0 };
    if (bulkField === "stock")    data = { stock: parseInt(bulkValue) || 0 };
    if (bulkField === "isActive") data = { isActive: bulkValue === "true" };
    if (bulkField === "brandId")  data = { brandId: bulkValue };
    if (bulkField === "categoryId") data = { categoryId: bulkValue };
    await bulkUpdateProducts(ids, data as never);
    setBulkSaving(false);
    setSelected(new Set());
    setBulkValue("");
    router.refresh();
  }

  /* ── Photo upload ────────────────────────── */
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!photoModal || !e.target.files?.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string };
      if (json.url) newUrls.push(json.url);
    }
    const updated = [...(photoModal.images ?? []), ...newUrls];
    await updateProductImages(photoModal.id, updated);
    setUploading(false);
    setPhotoModal((prev) => prev ? { ...prev, images: updated } : null);
    router.refresh();
  }

  async function removePhoto(url: string) {
    if (!photoModal) return;
    const updated = photoModal.images.filter((u) => u !== url);
    await updateProductImages(photoModal.id, updated);
    setPhotoModal((prev) => prev ? { ...prev, images: updated } : null);
    router.refresh();
  }

  /* ── Row helpers ─────────────────────────── */
  function handleToggle(id: string, current: boolean) {
    startTransition(async () => { await toggleProductActive(id, !current); router.refresh(); });
  }

  function handleDelete(id: string) {
    if (confirm("Bu ürün silinsin mi?")) {
      startTransition(async () => { await deleteProduct(id); router.refresh(); });
    }
  }

  /* ── Render helpers ──────────────────────── */
  function cellEditing(product: Product, field: string) {
    return editCell?.id === product.id && editCell.field === field;
  }

  function NumCell({ product, field, cls }: { product: Product; field: "price" | "costPrice" | "stock"; cls?: string }) {
    if (cellEditing(product, field)) {
      return (
        <input
          ref={editRef as React.RefObject<HTMLInputElement>}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => commitEdit()}
          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
          className={`w-24 border border-[#8b6f5e] rounded px-2 py-1 text-sm focus:outline-none ${cls ?? ""}`}
          disabled={saving}
        />
      );
    }
    let display = "—";
    if (field === "price")     display = `${Number(product.price).toLocaleString("tr-TR")} ₺`;
    if (field === "costPrice") display = product.costPrice ? `${Number(product.costPrice).toLocaleString("tr-TR")} ₺` : "—";
    if (field === "stock")     display = String(product.stock);
    return (
      <span
        onClick={() => startEdit(product, field)}
        title="Düzenlemek için tıkla"
        className={`cursor-pointer hover:bg-[#f5f0eb] px-1 py-0.5 rounded transition-colors ${cls ?? ""}`}
      >
        {display}
        {field === "stock" && product.stock === 0 && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Tükendi</span>}
        {field === "stock" && product.stock > 0 && product.stock <= 2 && <span className="ml-1 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">⚠</span>}
      </span>
    );
  }

  function SelectCell({ product, field, options }: {
    product: Product; field: "brandId" | "categoryId";
    options: { value: string; label: string }[];
  }) {
    if (cellEditing(product, field)) {
      return (
        <select
          ref={editRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => { setEditValue(e.target.value); commitEdit(e.target.value); }}
          onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
          className="border border-[#8b6f5e] rounded px-2 py-1 text-xs focus:outline-none bg-white"
          disabled={saving}
        >
          <option value="">—</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    const label = field === "brandId" ? product.brand?.name : product.category?.name;
    return (
      <span
        onClick={() => startEdit(product, field)}
        title="Düzenlemek için tıkla"
        className="cursor-pointer hover:bg-[#f5f0eb] px-1 py-0.5 rounded transition-colors text-xs"
      >
        {label ?? "—"}
      </span>
    );
  }

  return (
    <>
      {/* Top toolbar */}
      <div className="flex justify-end mb-4">
        <button onClick={() => startTransition(async () => { await backfillProductNos(); router.refresh(); })}
          className="border border-[#d4c5ba] text-[#8b6f5e] text-xs tracking-widest uppercase px-4 py-2 hover:bg-[#f5f0eb] transition-colors">
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
          <option value="">Stok Sırala</option>
          <option value="artan">Stok: Az → Çok</option>
          <option value="azalan">Stok: Çok → Az</option>
        </select>
        {(search || kategori || marka || durum || stokSort) && (
          <button onClick={() => { setSearch(""); setKategori(""); setMarka(""); setDurum(""); setStokSort(""); }}
            className="text-xs text-[#8b6f5e] hover:text-[#2c1810] px-2">Temizle</button>
        )}
      </div>

      <p className="text-xs text-[#b8a89e] mb-4">{filtered.length} ürün</p>

      {/* Table */}
      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#b8a89e]">Ürün bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
                  <th className="px-3 py-4">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll} className="accent-[#8b6f5e] cursor-pointer" />
                  </th>
                  {["No", "Ürün", "Marka", "Kategori", "Satış Fiyatı", "Geliş Fiyatı", "Stok", "Durum", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => {
                  const isSelected = selected.has(product.id);
                  const thumb = product.images?.[0] ?? null;
                  const extraCats = (product.extraCategoryIds ?? [])
                    .map((eid) => categories.find((c) => c.id === eid)?.name)
                    .filter(Boolean);
                  return (
                    <tr key={product.id}
                      className={"border-b border-[#f0ebe6] transition-colors " +
                        (isSelected ? "bg-[#fdf7f0]" : "hover:bg-[#faf8f6]") +
                        (i === filtered.length - 1 ? " border-b-0" : "")}>
                      {/* Checkbox */}
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.id)}
                          className="accent-[#8b6f5e] cursor-pointer" />
                      </td>
                      {/* No */}
                      <td className="px-4 py-3 text-xs text-[#b8a89e] font-mono whitespace-nowrap">{product.productNo ?? "—"}</td>
                      {/* Ürün adı + thumbnail */}
                      <td className="px-4 py-3 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail — tıklayınca fotoğraf modalı */}
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
                            {cellEditing(product, "name") ? (
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
                                >
                                  ↗
                                </a>
                              </div>
                            )}
                            {cellEditing(product, "slug") ? (
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
                        <SelectCell product={product} field="brandId"
                          options={brands.map((b) => ({ value: b.id, label: b.name }))} />
                      </td>
                      {/* Kategori */}
                      <td className="px-4 py-3 text-[#5c4033]">
                        <SelectCell product={product} field="categoryId"
                          options={categories.map((c) => ({ value: c.id, label: c.name }))} />
                        {extraCats.length > 0 && (
                          <span className="ml-1 text-[10px] text-[#b8a89e]">+{extraCats.length}</span>
                        )}
                      </td>
                      {/* Satış fiyatı */}
                      <td className="px-4 py-3">
                        <NumCell product={product} field="price" cls="text-[#2c1810] font-medium" />
                      </td>
                      {/* Geliş fiyatı */}
                      <td className="px-4 py-3">
                        <NumCell product={product} field="costPrice" cls="text-[#8b6f5e] text-xs" />
                      </td>
                      {/* Stok */}
                      <td className="px-4 py-3">
                        <NumCell product={product} field="stock"
                          cls={product.stock === 0 ? "text-red-600 font-medium" : product.stock <= 2 ? "text-orange-500 font-medium" : "text-[#5c4033]"} />
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
        )}
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
            {/* Mevcut fotoğraflar */}
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
            {/* Upload */}
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
