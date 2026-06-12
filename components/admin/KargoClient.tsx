"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Field, SelectField, TextareaField, SubmitRow } from "./FormField";
import { updateCargo, deleteCargo } from "@/lib/actions/cargo";

type Order = { id: string; orderNo: string; customerId: string };
type Customer = { id: string; name: string };
type Cargo = {
  id: string; company: string | null; trackingNo: string | null;
  status: string; notes: string | null; updatedAt: Date | string;
  order: Order; customer: Customer;
};

const STATUS = {
  PREPARING: { label: "Hazırlanıyor", color: "bg-yellow-100 text-yellow-700" },
  SHIPPED: { label: "Kargoya Verildi", color: "bg-blue-100 text-blue-700" },
  IN_TRANSIT: { label: "Yolda", color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-100 text-green-700" },
  RETURNED: { label: "İade", color: "bg-red-100 text-red-600" },
};

const COMPANIES = ["Yurtiçi Kargo", "MNG Kargo", "Aras Kargo", "PTT Kargo", "Sürat Kargo", "DHL"];

export default function KargoClient({ cargos }: { cargos: Cargo[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [form, setForm] = useState({ company: "", trackingNo: "", status: "PREPARING", notes: "" });

  function openEdit(c: Cargo) {
    setEditing(c);
    setForm({ company: c.company ?? "", trackingNo: c.trackingNo ?? "", status: c.status, notes: c.notes ?? "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      await updateCargo(editing.id, { company: form.company || undefined, trackingNo: form.trackingNo || undefined, status: form.status as never, notes: form.notes || undefined });
      router.refresh();
      setEditing(null);
    });
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      await updateCargo(id, { status: status as never });
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (confirm("Kargo kaydını silmek istiyor musunuz?")) {
      startTransition(async () => {
        await deleteCargo(id);
        router.refresh();
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Kargo Takibi</h2>
      </div>

      {cargos.length === 0 && (
        <div className="bg-[#faf8f6] border border-[#e8ddd6] rounded-sm p-8 text-center text-sm text-[#b8a89e]">
          Henüz kargo kaydı yok. Sipariş oluşturulduğunda burada görünecek.
        </div>
      )}

      {cargos.length > 0 && (
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
                const s = STATUS[c.status as keyof typeof STATUS] ?? STATUS.PREPARING;
                return (
                  <tr key={c.id} className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${i === cargos.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-6 py-4 font-medium text-[#2c1810]">{c.order.orderNo}</td>
                    <td className="px-6 py-4 text-[#5c4033]">{c.customer.name}</td>
                    <td className="px-6 py-4 text-[#5c4033]">{c.company || "—"}</td>
                    <td className="px-6 py-4"><code className="text-xs bg-[#f5f0eb] px-2 py-1 rounded">{c.trackingNo || "—"}</code></td>
                    <td className="px-6 py-4">
                      <select value={c.status} onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${s.color}`}>
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-[#8b6f5e]">{new Date(c.updatedAt).toLocaleDateString("tr-TR")}</td>
                    <td className="px-6 py-4 text-right flex gap-3 justify-end">
                      <button onClick={() => openEdit(c)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">Düzenle</button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">Sil</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Kargo Güncelle — ${editing?.order.orderNo}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField label="Kargo Firması" value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}>
            <option value="">Firma seçin</option>
            {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <Field label="Takip Numarası" value={form.trackingNo} onChange={(e) => setForm((p) => ({ ...p, trackingNo: e.target.value }))} placeholder="YK123456789" />
          <SelectField label="Durum" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </SelectField>
          <TextareaField label="Not" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Müşteriye bilgi verildi..." />
          <SubmitRow onCancel={() => setEditing(null)} label="Güncelle" />
        </form>
      </Modal>
    </div>
  );
}
