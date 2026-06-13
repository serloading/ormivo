"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Field, TextareaField, SubmitRow } from "./FormField";
import { createCustomer, updateCustomer, deleteCustomer } from "@/lib/actions/customer";

type Customer = {
  id: string; name: string; phone: string | null; email: string | null;
  city: string | null; note: string | null;
  _count?: { orders: number };
  createdAt: Date | string;
};

const EMPTY = { name: "", phone: "", email: "", city: "", note: "" }; // city field = adres

export default function MusterilerClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [detail, setDetail] = useState<Customer | null>(null);

  const filtered = customers.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search));

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", city: c.city ?? "", note: c.note ?? "" });
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
      startTransition(async () => {
        await deleteCustomer(id);
        router.refresh();
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Müşteriler</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">{customers.length} kayıtlı müşteri</p>
        </div>
        <button onClick={openAdd} className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">+ Müşteri Ekle</button>
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm p-4 mb-6">
        <input type="text" placeholder="İsim veya telefon ara..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]" />
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Ad Soyad", "Telefon", "Adres", "Sipariş", "Kayıt", ""].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[#b8a89e]">Müşteri bulunamadı.</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                <td className="px-6 py-4">
                  <button onClick={() => setDetail(c)} className="font-medium text-[#2c1810] hover:underline text-left">{c.name}</button>
                  {c.email && <p className="text-xs text-[#b8a89e]">{c.email}</p>}
                </td>
                <td className="px-6 py-4 text-[#5c4033]">{c.phone || "—"}</td>
                <td className="px-6 py-4 text-[#5c4033]">{c.city || "—"}</td>
                <td className="px-6 py-4 text-[#5c4033]">{c._count?.orders ?? 0}</td>
                <td className="px-6 py-4 text-[#8b6f5e]">{new Date(c.createdAt).toLocaleDateString("tr-TR")}</td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button onClick={() => openEdit(c)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810] mr-4">Düzenle</button>
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
          <Field label="Adres" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Kadıköy, İstanbul" />
          <TextareaField label="Not" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Özel not..." />
          <SubmitRow onCancel={() => setModal(false)} label={editing ? "Güncelle" : "Kaydet"} />
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Müşteri Detayı">
        {detail && (
          <div className="space-y-3">
            {[
              ["Ad Soyad", detail.name],
              ["Telefon", detail.phone || "—"],
              ["E-posta", detail.email || "—"],
              ["Adres", detail.city || "—"],
              ["Sipariş Sayısı", `${detail._count?.orders ?? 0} sipariş`],
              ["Kayıt", new Date(detail.createdAt).toLocaleDateString("tr-TR")],
              ["Not", detail.note || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-[#f0ebe6] pb-2.5">
                <span className="text-[#8b6f5e]">{k}</span>
                <span className="text-[#2c1810] font-medium">{v}</span>
              </div>
            ))}
            {detail.phone && (
              <a href={`https://wa.me/9${detail.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase py-3 hover:bg-[#3d2418] transition-colors mt-4">
                WhatsApp&apos;tan Yaz
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
