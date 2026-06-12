"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Field, TextareaField, SubmitRow } from "./FormField";
import { mockCategories, type MockCategory } from "@/lib/mock-data";

function toSlug(text: string) {
  return text.toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const empty = { name: "", slug: "", description: "" };

export default function KategorilerClient() {
  const [cats, setCats] = useState<MockCategory[]>(mockCategories);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<MockCategory | null>(null);
  const [form, setForm] = useState(empty);

  function openAdd() { setEditing(null); setForm(empty); setModal(true); }
  function openEdit(c: MockCategory) { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description }); setModal(true); }

  function handleNameChange(name: string) {
    setForm((p) => ({ ...p, name, slug: editing ? p.slug : toSlug(name) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      setCats((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...form } : c));
    } else {
      setCats((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    }
    setModal(false);
  }

  function handleDelete(id: string) {
    if (confirm("Kategoriyi silmek istediğinize emin misiniz?"))
      setCats((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Kategoriler</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">{cats.length} kategori</p>
        </div>
        <button onClick={openAdd} className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
          + Kategori Ekle
        </button>
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Kategori", "Slug", "Açıklama", ""].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cats.map((cat, i) => (
              <tr key={cat.id} className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${i === cats.length - 1 ? "border-b-0" : ""}`}>
                <td className="px-6 py-4 font-medium text-[#2c1810]">{cat.name}</td>
                <td className="px-6 py-4 text-[#8b6f5e]">/{cat.slug}</td>
                <td className="px-6 py-4 text-[#5c4033]">{cat.description}</td>
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
          <Field label="Kategori Adı" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Kadın" />
          <div>
            <Field label="Slug" required value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="kadin" />
            <p className="text-xs text-[#b8a89e] mt-1">/urunler?kategori={form.slug || "slug"}</p>
          </div>
          <TextareaField label="Açıklama" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Kadın parfümleri..." />
          <SubmitRow onCancel={() => setModal(false)} label={editing ? "Güncelle" : "Kaydet"} />
        </form>
      </Modal>
    </div>
  );
}
