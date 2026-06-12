"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Field, SelectField, TextareaField, SubmitRow } from "./FormField";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Cargo = { id: string; orderNo: string; customer: string; company: string; trackingNo: string; status: string; notes: string; updatedAt: string };

const STATUS = {
  PREPARING: { label: "Hazırlanıyor", color: "bg-yellow-100 text-yellow-700" },
  SHIPPED: { label: "Kargoya Verildi", color: "bg-blue-100 text-blue-700" },
  IN_TRANSIT: { label: "Yolda", color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-100 text-green-700" },
  RETURNED: { label: "İade", color: "bg-red-100 text-red-600" },
};

const COMPANIES = ["Yurtiçi Kargo", "MNG Kargo", "Aras Kargo", "PTT Kargo", "Sürat Kargo", "DHL"];

const INITIAL: Cargo[] = [
  { id: "1", orderNo: "ORV-001", customer: "Ayşe Kaya", company: "Yurtiçi Kargo", trackingNo: "YK123456789", status: "DELIVERED", notes: "", updatedAt: "2024-01-22" },
  { id: "2", orderNo: "ORV-002", customer: "Mehmet Demir", company: "MNG Kargo", trackingNo: "MNG987654321", status: "IN_TRANSIT", notes: "Müşteri telefon etsin", updatedAt: "2024-02-24" },
];

const EMPTY = { orderNo: "", customer: "", company: "", trackingNo: "", status: "PREPARING", notes: "" };

export default function KargoClient() {
  const [cargos, setCargos, loaded] = useLocalStorage<Cargo[]>("ormivo_cargos", INITIAL);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [form, setForm] = useState(EMPTY);

  if (!loaded) return <div className="h-64 flex items-center justify-center text-[#b8a89e] text-sm">Yükleniyor...</div>;

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(c: Cargo) { setEditing(c); setForm({ orderNo: c.orderNo, customer: c.customer, company: c.company, trackingNo: c.trackingNo, status: c.status, notes: c.notes }); setModal(true); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date().toLocaleDateString("tr-TR");
    if (editing) {
      setCargos((p) => p.map((c) => c.id === editing.id ? { ...c, ...form, updatedAt: now } : c));
    } else {
      setCargos((p) => [{ id: Date.now().toString(), ...form, updatedAt: now }, ...p]);
    }
    setModal(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Kargo Takibi</h2>
        <button onClick={openAdd} className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">+ Kargo Ekle</button>
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Sipariş", "Müşteri", "Firma", "Takip No", "Durum", "Güncelleme", ""].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargos.map((c, i) => {
              const s = STATUS[c.status as keyof typeof STATUS];
              return (
                <tr key={c.id} className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${i === cargos.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-6 py-4 font-medium text-[#2c1810]">{c.orderNo}</td>
                  <td className="px-6 py-4 text-[#5c4033]">{c.customer}</td>
                  <td className="px-6 py-4 text-[#5c4033]">{c.company || "—"}</td>
                  <td className="px-6 py-4"><code className="text-xs bg-[#f5f0eb] px-2 py-1 rounded">{c.trackingNo || "—"}</code></td>
                  <td className="px-6 py-4">
                    <select value={c.status} onChange={(e) => setCargos((p) => p.map((x) => x.id === c.id ? { ...x, status: e.target.value, updatedAt: new Date().toLocaleDateString("tr-TR") } : x))}
                      className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${s.color}`}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-[#8b6f5e]">{c.updatedAt}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(c)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">Düzenle</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Kargo Güncelle" : "Yeni Kargo"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sipariş No" required value={form.orderNo} onChange={(e) => setForm((p) => ({ ...p, orderNo: e.target.value }))} placeholder="ORV-003" />
            <Field label="Müşteri" required value={form.customer} onChange={(e) => setForm((p) => ({ ...p, customer: e.target.value }))} placeholder="Ad Soyad" />
          </div>
          <SelectField label="Kargo Firması" value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}>
            <option value="">Firma seçin</option>
            {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <Field label="Takip Numarası" value={form.trackingNo} onChange={(e) => setForm((p) => ({ ...p, trackingNo: e.target.value }))} placeholder="YK123456789" />
          <SelectField label="Durum" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </SelectField>
          <TextareaField label="Not" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Müşteriye bilgi verildi..." />
          <SubmitRow onCancel={() => setModal(false)} label={editing ? "Güncelle" : "Kaydet"} />
        </form>
      </Modal>
    </div>
  );
}
