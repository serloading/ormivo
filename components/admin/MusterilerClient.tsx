"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "./Modal";
import { Field, TextareaField, SubmitRow } from "./FormField";
import { createCustomer, updateCustomer, deleteCustomer } from "@/lib/actions/customer";
import { SEGMENT_LABELS, SEGMENT_COLORS } from "@/lib/customer-constants";

type Customer = {
  id: string; name: string; phone: string | null; email: string | null;
  city: string | null; address: string | null; note: string | null; segment: string | null; tags: string[];
  _count?: { orders: number; siteOrders: number };
  createdAt: Date | string;
};

const EMPTY = { name: "", phone: "", email: "", address: "", note: "" };

export default function MusterilerClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch]       = useState("");
  const [segFilter, setSegFilter] = useState("");
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<Customer | null>(null);
  const [form, setForm]           = useState(EMPTY);

  const filtered = customers.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search);
    const matchSeg    = !segFilter || c.segment === segFilter;
    return matchSearch && matchSeg;
  });

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", note: c.note ?? "" });
    setModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (editing) await updateCustomer(editing.id, form);
      else await createCustomer(form);
      router.refresh();
      setModal(false);
    });
  }

  function handleDelete(id: string) {
    if (confirm("Müşteriyi silmek istediğinize emin misiniz?")) {
      startTransition(async () => { await deleteCustomer(id); router.refresh(); });
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Müşteriler</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">{customers.length} kayıtlı müşteri</p>
        </div>
        <button onClick={openAdd} className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">+ Müşteri Ekle</button>
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm p-4 mb-6 flex flex-wrap gap-3">
        <input type="text" placeholder="İsim veya telefon ara..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]" />
        <select value={segFilter} onChange={(e) => setSegFilter(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tüm Segmentler</option>
          {Object.entries(SEGMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {(search || segFilter) && (
          <button onClick={() => { setSearch(""); setSegFilter(""); }} className="text-xs text-[#8b6f5e] hover:text-[#2c1810] px-2">Temizle</button>
        )}
      </div>

      <p className="text-xs text-[#b8a89e] mb-4">{filtered.length} müşteri</p>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Ad Soyad", "Telefon", "Adres", "Segment", "Sipariş", "Kayıt", ""].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-[#b8a89e]">Müşteri bulunamadı.</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                <td className="px-6 py-4">
                  <Link href={`/admin/musteriler/${c.id}`} className="font-medium text-[#2c1810] hover:underline">
                    {c.name}
                  </Link>
                  {c.email && <p className="text-xs text-[#b8a89e]">{c.email}</p>}
                  {c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.tags.map((t) => (
                        <span key={t} className="text-[10px] bg-[#f0ebe6] text-[#5c4033] px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-[#5c4033]">{c.phone || "—"}</td>
                <td className="px-6 py-4 text-[#5c4033]">{c.address || "—"}</td>
                <td className="px-6 py-4">
                  {c.segment ? (
                    <span className={`text-[10px] tracking-wide px-2 py-0.5 rounded border font-medium ${SEGMENT_COLORS[c.segment] ?? "bg-gray-100 text-gray-600"}`}>
                      {SEGMENT_LABELS[c.segment] ?? c.segment}
                    </span>
                  ) : <span className="text-[#b8a89e]">—</span>}
                </td>
                <td className="px-6 py-4 text-[#5c4033]">
                  {((c._count?.orders ?? 0) + (c._count?.siteOrders ?? 0))}
                </td>
                <td className="px-6 py-4 text-[#8b6f5e]">{new Date(c.createdAt).toLocaleDateString("tr-TR")}</td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Link href={`/admin/musteriler/${c.id}`} className="text-xs text-[#8b6f5e] hover:text-[#2c1810] mr-3">Profil</Link>
                  <button onClick={() => openEdit(c)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810] mr-3">Düzenle</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Müşteri Düzenle" : "Yeni Müşteri"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Ad Soyad" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ayşe Kaya" />
          <Field label="Telefon" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="0532 000 0000" />
          <Field label="E-posta" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="ayse@email.com" />
          <Field label="Adres" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="İstanbul, Kadıköy..." />
          <TextareaField label="Not" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Özel not..." />
          <SubmitRow onCancel={() => setModal(false)} label={editing ? "Güncelle" : "Kaydet"} />
        </form>
      </Modal>
    </>
  );
}
