"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "./Modal";
import { Field, TextareaField, SubmitRow } from "./FormField";
import { createCustomer, updateCustomer, deleteCustomer, backfillCustomerNos } from "@/lib/actions/customer";
import { updateCustomerSegment } from "@/lib/actions/customer";
import { SEGMENTS, SEGMENT_LABELS, SEGMENT_COLORS } from "@/lib/customer-constants";

type SortKey = "name" | "segment" | "orders" | "createdAt";
type SortDir = "asc" | "desc";

const SEGMENT_ICONS: Record<string, { letter: string; cls: string }> = {
  DIAMOND: { letter: "D", cls: "bg-cyan-500 text-white" },
  GOLD:   { letter: "G", cls: "bg-yellow-400 text-yellow-900" },
  SILVER: { letter: "S", cls: "bg-gray-300 text-gray-700" },
  BRONZE: { letter: "B", cls: "bg-orange-400 text-orange-900" },
};

type Customer = {
  id: string; customerNo: string | null; name: string; phone: string | null; email: string | null;
  city: string | null; address: string | null; note: string | null; segment: string | null; tags: string[];
  _count?: { orders: number; siteOrders: number };
  createdAt: Date | string;
};

const EMPTY = { name: "", phone: "", email: "", address: "", note: "" };
const SEGMENT_ORDER: Record<string, number> = { DIAMOND: 0, GOLD: 1, SILVER: 2, BRONZE: 3 };

export default function MusterilerClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch]       = useState("");
  const [segFilter, setSegFilter] = useState("");
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<Customer | null>(null);
  const [form, setForm]           = useState(EMPTY);
  const [formSegment, setFormSegment] = useState("");
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [sortKey, setSortKey]     = useState<SortKey>("createdAt");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");

  function toggleSelect(id: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }
  function toggleAll() {
    setSelected((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id)));
  }
  function handleBulkDelete() {
    if (!confirm(`${selected.size} müşteriyi silmek istediğinize emin misiniz?`)) return;
    startTransition(async () => {
      for (const id of selected) await deleteCustomer(id);
      setSelected(new Set());
      router.refresh();
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = useMemo(() => {
    const base = customers.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search);
      const matchSeg    = !segFilter || c.segment === segFilter;
      return matchSearch && matchSeg;
    });

    return [...base].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name, "tr");
      } else if (sortKey === "segment") {
        cmp = (SEGMENT_ORDER[a.segment ?? ""] ?? 99) - (SEGMENT_ORDER[b.segment ?? ""] ?? 99);
      } else if (sortKey === "orders") {
        const aO = (a._count?.orders ?? 0) + (a._count?.siteOrders ?? 0);
        const bO = (b._count?.orders ?? 0) + (b._count?.siteOrders ?? 0);
        cmp = aO - bO;
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [customers, search, segFilter, sortKey, sortDir]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setFormSegment("");
    setModal(true);
  }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", note: c.note ?? "" });
    setFormSegment(c.segment ?? "");
    setModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editing) {
          await updateCustomer(editing.id, form);
          await updateCustomerSegment(editing.id, formSegment || null);
        } else {
          await createCustomer(form);
        }
        router.refresh();
        setModal(false);
      } catch (err) {
        console.error("Müşteri kaydedilemedi:", err);
        const msg = err instanceof Error ? err.message : String(err);
        alert("Kayıt sırasında hata oluştu:\n" + msg);
      }
    });
  }

  function handleDelete(id: string) {
    if (confirm("Müşteriyi silmek istediğinize emin misiniz?")) {
      startTransition(async () => { await deleteCustomer(id); router.refresh(); });
    }
  }

  // Sıralanabilir başlık yardımcısı
  function SortTh({ k, label }: { k: SortKey; label: string }) {
    return (
      <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">
        <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-[#2c1810] transition-colors group">
          {label}
          <span className="text-[10px] text-[#d4c5ba] group-hover:text-[#8b6f5e]">
            {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Müşteriler</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">{customers.length} kayıtlı müşteri</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={handleBulkDelete} className="bg-red-600 text-white text-xs tracking-widest uppercase px-4 py-3 hover:bg-red-700 transition-colors">
              {selected.size} Müşteriyi Sil
            </button>
          )}
          <button onClick={openAdd} className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">+ Müşteri Ekle</button>
        </div>
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
              <th className="px-4 py-4 w-8">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll}
                  className="rounded border-[#d4c5ba]" />
              </th>
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">No</th>
              <SortTh k="segment" label="Seg." />
              <SortTh k="name" label="Ad Soyad" />
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">Telefon</th>
              <th className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">Adres</th>
              <SortTh k="orders" label="Sipariş" />
              <SortTh k="createdAt" label="Kayıt" />
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-[#b8a89e]">Müşteri bulunamadı.</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${selected.has(c.id) ? "bg-red-50" : ""} ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                <td className="px-4 py-4">
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-[#d4c5ba]" />
                </td>
                <td className="px-6 py-4 text-xs text-[#b8a89e] font-mono">{c.customerNo ?? "—"}</td>
                <td className="px-6 py-4">
                  {c.segment && SEGMENT_ICONS[c.segment] ? (
                    <span title={SEGMENT_LABELS[c.segment]} className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${SEGMENT_ICONS[c.segment].cls}`}>
                      {SEGMENT_ICONS[c.segment].letter}
                    </span>
                  ) : <span className="text-[#d4c5ba]">—</span>}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/admin/musteriler/${c.id}`} className="font-medium text-[#2c1810] hover:underline">
                    {c.name}
                  </Link>
                  {c.email && <p className="text-xs text-[#b8a89e] mt-0.5">{c.email}</p>}
                </td>
                <td className="px-6 py-4 text-[#5c4033]">{c.phone || "—"}</td>
                <td className="px-6 py-4 text-[#5c4033]">{c.address || "—"}</td>
                <td className="px-6 py-4">
                  {(() => {
                    const total = (c._count?.orders ?? 0) + (c._count?.siteOrders ?? 0);
                    return total > 0 ? (
                      <Link href={`/admin/musteriler/${c.id}`} className="font-medium text-[#2c1810] hover:underline">
                        {total}
                      </Link>
                    ) : <span className="text-[#b8a89e]">0</span>;
                  })()}
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

          {editing && (
            <div>
              <label className="block text-xs font-medium text-[#5c4033] mb-1.5">Segment</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormSegment("")}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${!formSegment ? "bg-[#2c1810] text-white border-[#2c1810]" : "border-[#d4c5ba] text-[#8b6f5e] hover:bg-[#f5f0eb]"}`}>
                  Yok
                </button>
                {SEGMENTS.map((s) => (
                  <button key={s} type="button" onClick={() => setFormSegment(s)}
                    className={`px-3 py-1.5 text-xs rounded border font-medium transition-colors ${formSegment === s ? SEGMENT_COLORS[s] + " border-current" : "border-[#d4c5ba] text-[#8b6f5e] hover:bg-[#f5f0eb]"}`}>
                    {SEGMENT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <SubmitRow onCancel={() => setModal(false)} label={editing ? "Güncelle" : "Kaydet"} />
        </form>
      </Modal>
    </>
  );
}
