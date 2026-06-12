"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Field, SelectField, SubmitRow } from "./FormField";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Rec = { id: string; type: "INCOME" | "EXPENSE"; description: string; category: string; amount: number; date: string };

const CATS = { INCOME: ["Satış", "Kargo Geliri", "Diğer Gelir"], EXPENSE: ["Tedarik", "Lojistik", "Pazarlama", "Kira", "Diğer Gider"] };

const INITIAL: Rec[] = [
  { id: "1", type: "INCOME", description: "Ambra Noir — Ayşe Kaya", category: "Satış", amount: 890, date: "2024-01-20" },
  { id: "2", type: "INCOME", description: "Cedar Oud + Rose Eternel — Mehmet Demir", category: "Satış", amount: 1840, date: "2024-02-22" },
  { id: "3", type: "EXPENSE", description: "Şişe tedariki", category: "Tedarik", amount: 450, date: "2024-02-01" },
  { id: "4", type: "EXPENSE", description: "Kargo masrafları", category: "Lojistik", amount: 120, date: "2024-02-25" },
];

const EMPTY = { type: "INCOME" as "INCOME" | "EXPENSE", description: "", category: "", amount: "", date: new Date().toISOString().split("T")[0] };

export default function FinansClient() {
  const [records, setRecords, loaded] = useLocalStorage<Rec[]>("ormivo_finans", INITIAL);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filterType, setFilterType] = useState("");

  if (!loaded) return <div className="h-64 flex items-center justify-center text-[#b8a89e] text-sm">Yükleniyor...</div>;

  const filtered = records.filter((r) => !filterType || r.type === filterType);
  const gelir = records.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amount, 0);
  const gider = records.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amount, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRecords((p) => [{ id: Date.now().toString(), type: form.type, description: form.description, category: form.category, amount: Number(form.amount), date: form.date }, ...p]);
    setForm(EMPTY); setModal(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Finans</h2>
        <button onClick={() => setModal(true)} className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">+ Kayıt Ekle</button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {[{ label: "Toplam Gelir", value: gelir, color: "text-green-700" }, { label: "Toplam Gider", value: gider, color: "text-red-600" }, { label: "Net Kâr", value: gelir - gider, color: gelir - gider >= 0 ? "text-green-700" : "text-red-600" }].map((s) => (
          <div key={s.label} className="bg-white border border-[#e8ddd6] rounded-sm p-6">
            <p className="text-xs tracking-widest text-[#8b6f5e] uppercase mb-3">{s.label}</p>
            <p className={`text-2xl font-light ${s.color}`}>{s.value.toLocaleString("tr-TR")} ₺</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {[["", "Tümü"], ["INCOME", "Gelirler"], ["EXPENSE", "Giderler"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilterType(v)}
            className={`text-xs px-4 py-2 rounded-sm border transition-colors ${filterType === v ? "bg-[#2c1810] text-[#f5f0eb] border-[#2c1810]" : "border-[#d4c5ba] text-[#5c4033] hover:bg-[#f5f0eb]"}`}>{l}</button>
        ))}
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Tür", "Açıklama", "Kategori", "Tutar", "Tarih", ""].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                <td className="px-6 py-4">
                  <span className={`text-xs px-3 py-1 rounded-full ${r.type === "INCOME" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{r.type === "INCOME" ? "Gelir" : "Gider"}</span>
                </td>
                <td className="px-6 py-4 text-[#2c1810]">{r.description}</td>
                <td className="px-6 py-4 text-[#8b6f5e]">{r.category}</td>
                <td className={`px-6 py-4 font-medium ${r.type === "INCOME" ? "text-green-700" : "text-red-600"}`}>{r.type === "INCOME" ? "+" : "−"}{r.amount.toLocaleString("tr-TR")} ₺</td>
                <td className="px-6 py-4 text-[#8b6f5e]">{r.date}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { if (confirm("Bu kaydı silmek istiyor musunuz?")) setRecords((p) => p.filter((x) => x.id !== r.id)); }} className="text-xs text-red-400 hover:text-red-600">Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Finans Kaydı Ekle">
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField label="Tür" required value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "INCOME" | "EXPENSE", category: "" }))}>
            <option value="INCOME">Gelir</option>
            <option value="EXPENSE">Gider</option>
          </SelectField>
          <Field label="Açıklama" required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ambra Noir satışı..." />
          <SelectField label="Kategori" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
            <option value="">Kategori seçin</option>
            {CATS[form.type].map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tutar (₺)" required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="890" />
            <Field label="Tarih" required type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </div>
          <SubmitRow onCancel={() => setModal(false)} label="Kaydet" />
        </form>
      </Modal>
    </div>
  );
}
