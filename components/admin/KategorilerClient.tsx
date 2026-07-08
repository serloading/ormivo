"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Field, TextareaField, SubmitRow } from "./FormField";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/category";

type Category = { id: string; name: string; slug: string; description: string | null; _count: { products: number } };

function toSlug(t: string) {
  return t.toLowerCase().replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").trim();
}

const EMPTY = { name: "", slug: "", description: "" };

export default function KategorilerClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(c: Category) { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description ?? "" }); setModal(true); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (editing) await updateCategory(editing.id, form);
      else await createCategory(form);
      router.refresh();
      setModal(false);
    });
  }

  function handleDelete(id: string) {
    if (confirm("Kategoriyi silmek istiyor musunuz?")) {
      startTransition(async () => {
        await deleteCategory(id);
        router.refresh();
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Kategoriler</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">{categories.length} kategori</p>
        </div>
        <button onClick={openAdd} className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">+ Kategori Ekle</button>
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Kategori", "Slug", "Açıklama", "Ürün", ""].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => (
              <tr key={cat.id} className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${i === categories.length - 1 ? "border-b-0" : ""}`}>
                <td className="px-6 py-4 font-medium text-[#2c1810]">{cat.name}</td>
                <td className="px-6 py-4 text-[#8b6f5e]">/{cat.slug}</td>
                <td className="px-6 py-4 text-[#5c4033]">{cat.description || "—"}</td>
                <td className="px-6 py-4">
                  <Link href={`/urunler?kategori=${cat.slug}`} target="_blank" className="text-sm font-medium text-[#2c1810] hover:underline">
                    {cat._count.products} ürün
                  </Link>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button onClick={() => openEdit(cat)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810] mr-4">Düzenle</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-400 hover:text-red-600">Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Kategori Düzenle" : "Yeni Kategori"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Kategori Adı" required value={form.name} onChange={(e) => { const n = e.target.value; setForm((p) => ({ ...p, name: n, slug: editing ? p.slug : toSlug(n) })); }} placeholder="Kadın" />
          <div>
            <Field label="Slug" required value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="kadin" />
            <p className="text-xs text-[#b8a89e] mt-1">/urunler?kategori={form.slug || "slug"}</p>
          </div>
          <TextareaField label="Açıklama" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Kadın parfümleri..." />
          <SubmitRow onCancel={() => setModal(false)} label={editing ? "Güncelle" : "Kaydet"} loading={isPending} />
        </form>
      </Modal>
    </div>
  );
}
