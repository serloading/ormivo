"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomer, updateCustomerSegment, updateCustomerTags, addCustomerNote, deleteCustomerNote, createSiteUserForCustomer } from "@/lib/actions/customer";
import { SEGMENTS, SEGMENT_LABELS, SEGMENT_COLORS } from "@/lib/customer-constants";

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Beklemede",
  SHIPPED:   "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  PAID:    "Ödendi",
  FREE:    "Bedava",
};

const PREDEFINED_TAGS = ["B2B", "Toptan", "Sadık", "Kurumsal", "Sorunlu"];

type CustomerData = {
  id: string; name: string; phone: string | null; email: string | null;
  city: string | null; address: string | null; note: string | null;
  segment: string | null; tags: string[];
  notes: { id: string; content: string; createdBy: string; createdAt: string }[];
  createdAt: string;
};

type OrderRow = {
  id: string; orderNo: string; source: "web" | "manuel";
  status: string; total: number; paymentStatus: string; createdAt: string;
};

export default function MusteriProfilClient({
  customer, orders, totalSpend,
}: {
  customer: CustomerData;
  orders: OrderRow[];
  totalSpend: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Müşteri bilgileri düzenleme
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    name:    customer.name,
    phone:   customer.phone ?? "",
    email:   customer.email ?? "",
    address: customer.address ?? "",
    note:    customer.note ?? "",
  });
  const [infoSaving, startInfoT] = useTransition();

  function handleInfoSave(e: React.FormEvent) {
    e.preventDefault();
    startInfoT(async () => {
      await updateCustomer(customer.id, {
        name:    infoForm.name.trim(),
        phone:   infoForm.phone.trim() || undefined,
        email:   infoForm.email.trim() || undefined,
        address: infoForm.address.trim() || undefined,
        note:    infoForm.note.trim() || undefined,
      });
      setEditingInfo(false);
      router.refresh();
    });
  }

  const [segment, setSegment] = useState(customer.segment ?? "");
  const [tags, setTags]       = useState<string[]>(customer.tags);
  const [newTag, setNewTag]   = useState("");
  const [noteText, setNoteText] = useState("");

  function handleSegmentChange(val: string) {
    setSegment(val);
    startTransition(async () => {
      await updateCustomerSegment(customer.id, val || null);
      router.refresh();
    });
  }

  function addTag(tag: string) {
    const t = tag.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setNewTag("");
    startTransition(async () => { await updateCustomerTags(customer.id, next); router.refresh(); });
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    startTransition(async () => { await updateCustomerTags(customer.id, next); router.refresh(); });
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    startTransition(async () => {
      await addCustomerNote(customer.id, noteText);
      setNoteText("");
      router.refresh();
    });
  }

  function handleDeleteNote(noteId: string) {
    if (!confirm("Not silinsin mi?")) return;
    startTransition(async () => { await deleteCustomerNote(noteId, customer.id); router.refresh(); });
  }

  const lastOrder = orders[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Sol kolon */}
      <div className="space-y-4">

        {/* Müşteri Bilgileri — düzenlenebilir */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs tracking-widest text-[#5c4033] uppercase">Müşteri Bilgileri</h3>
            {!editingInfo && (
              <button onClick={() => setEditingInfo(true)}
                className="text-xs text-[#8b6f5e] hover:text-[#2c1810] underline">Düzenle</button>
            )}
          </div>

          {editingInfo ? (
            <form onSubmit={handleInfoSave} className="space-y-3">
              {[
                { label: "Ad Soyad *", key: "name",    type: "text" },
                { label: "Telefon",    key: "phone",   type: "tel" },
                { label: "E-posta",   key: "email",   type: "email" },
                { label: "Adres",     key: "address", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs text-[#8b6f5e] block mb-0.5">{label}</label>
                  <input type={type} value={infoForm[key as keyof typeof infoForm]}
                    onChange={(e) => setInfoForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]" />
                </div>
              ))}
              <div>
                <label className="text-xs text-[#8b6f5e] block mb-0.5">Not</label>
                <textarea value={infoForm.note} onChange={(e) => setInfoForm((p) => ({ ...p, note: e.target.value }))} rows={2}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e] resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={infoSaving || !infoForm.name.trim()}
                  className="flex-1 bg-[#2c1810] text-[#f5f0eb] text-xs py-2 hover:bg-[#3d2418] transition-colors disabled:opacity-60">
                  {infoSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button type="button" onClick={() => setEditingInfo(false)}
                  className="px-4 text-xs text-[#8b6f5e] border border-[#d4c5ba] hover:bg-[#f5f0eb]">İptal</button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-3">
                {[
                  ["Telefon",     customer.phone   || "—"],
                  ["E-posta",    customer.email   || "—"],
                  ["Adres",      customer.address || "—"],
                  ["Not",        customer.note    || "—"],
                  ["Kayıt",      new Date(customer.createdAt).toLocaleDateString("tr-TR")],
                  ["Son Sipariş", lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString("tr-TR") : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm border-b border-[#f0ebe6] pb-2 last:border-0">
                    <span className="text-[#8b6f5e]">{k}</span>
                    <span className="text-[#2c1810] font-medium text-right max-w-[160px] break-words">{v}</span>
                  </div>
                ))}
              </div>
              {customer.phone && (
                <a href={`https://wa.me/9${customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase py-2.5 hover:bg-[#3d2418] transition-colors mt-4">
                  WhatsApp&apos;tan Yaz
                </a>
              )}
              <SiteHesapButonu customerId={customer.id} phone={customer.phone} />
            </>
          )}
        </div>

        {/* Özet */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sipariş",   value: orders.length },
            { label: "Toplam",    value: `${totalSpend.toLocaleString("tr-TR")}₺` },
            { label: "Ödendi",    value: orders.filter((o) => o.paymentStatus === "PAID").length },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#e8ddd6] rounded-sm p-3 text-center">
              <p className="text-lg font-light text-[#2c1810]">{s.value}</p>
              <p className="text-[10px] text-[#8b6f5e] uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Segment */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-5">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-3">Segment</h3>
          <select value={segment} onChange={(e) => handleSegmentChange(e.target.value)}
            className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]">
            <option value="">— Segment Seç —</option>
            {SEGMENTS.map((s) => <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>)}
          </select>
          {segment && (
            <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded border font-medium ${SEGMENT_COLORS[segment] ?? ""}`}>
              {SEGMENT_LABELS[segment] ?? segment}
            </span>
          )}
        </div>

        {/* Etiketler */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-5">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-3">Etiketler</h3>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 text-xs bg-[#f0ebe6] text-[#5c4033] px-2 py-0.5 rounded">
                {t}
                <button onClick={() => removeTag(t)} className="text-[#8b6f5e] hover:text-red-500 leading-none">×</button>
              </span>
            ))}
            {tags.length === 0 && <p className="text-xs text-[#b8a89e]">Etiket yok.</p>}
          </div>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {PREDEFINED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
              <button key={t} onClick={() => addTag(t)}
                className="text-[10px] border border-dashed border-[#d4c5ba] text-[#8b6f5e] px-2 py-0.5 rounded hover:border-[#8b6f5e] hover:text-[#2c1810] transition-colors">
                + {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newTag))}
              placeholder="Özel etiket..." className="flex-1 border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]" />
            <button onClick={() => addTag(newTag)}
              className="bg-[#2c1810] text-[#f5f0eb] text-xs px-3 py-1.5 rounded-sm hover:bg-[#3d2418]">Ekle</button>
          </div>
        </div>
      </div>

      {/* Sağ kolon */}
      <div className="lg:col-span-2 space-y-4">

        {/* Notlar */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-5">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">Admin Notları</h3>
          <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
            <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="Not ekle..." className="flex-1 border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]" />
            <button type="submit" className="bg-[#2c1810] text-[#f5f0eb] text-xs px-4 py-2 hover:bg-[#3d2418] transition-colors">Ekle</button>
          </form>
          {customer.notes.length === 0 ? (
            <p className="text-sm text-[#b8a89e]">Henüz not yok.</p>
          ) : (
            <div className="space-y-2">
              {customer.notes.map((n) => (
                <div key={n.id} className="flex items-start justify-between gap-3 border border-[#f0ebe6] rounded-sm p-3 bg-[#faf8f6]">
                  <div>
                    <p className="text-sm text-[#2c1810]">{n.content}</p>
                    <p className="text-[10px] text-[#b8a89e] mt-1">{n.createdBy} · {new Date(n.createdAt).toLocaleString("tr-TR")}</p>
                  </div>
                  <button onClick={() => handleDeleteNote(n.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">Sil</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sipariş geçmişi */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-5">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">Sipariş Geçmişi</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-[#b8a89e]">Sipariş yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0ebe6]">
                  {["Sipariş No", "Kaynak", "Durum", "Ödeme", "Tutar", "Tarih"].map((h) => (
                    <th key={h} className="text-left pb-2 text-xs tracking-wide text-[#8b6f5e] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-[#f0ebe6] last:border-0 hover:bg-[#faf8f6]">
                    <td className="py-2.5">
                      <a
                        href={`/admin/siparisler/detay?id=${o.id}&source=${o.source}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs font-semibold text-[#2c1810] hover:text-indigo-600 hover:underline"
                      >
                        #{o.orderNo}
                      </a>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${o.source === "web" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                        {o.source === "web" ? "Web" : "Manuel"}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#5c4033] text-xs">{STATUS_LABELS[o.status] ?? o.status}</td>
                    <td className="py-2.5 text-[#5c4033] text-xs">{PAYMENT_LABELS[o.paymentStatus] ?? o.paymentStatus}</td>
                    <td className="py-2.5 text-[#2c1810] font-medium">{o.total.toLocaleString("tr-TR")}₺</td>
                    <td className="py-2.5 text-[#8b6f5e] text-xs">{new Date(o.createdAt).toLocaleDateString("tr-TR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function SiteHesapButonu({ customerId, phone }: { customerId: string; phone: string | null }) {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  if (!phone) return (
    <p className="text-[10px] text-[#8b6f5e] text-center mt-3">Telefon numarası eklenince site hesabı oluşturulabilir.</p>
  );

  function handleCreate() {
    start(async () => {
      const r = await createSiteUserForCustomer(customerId);
      setMsg(r.error ? `Hata: ${r.error}` : "Site hesabı oluşturuldu. Müşteri telefonu ve varsayılan şifre ile giriş yapabilir.");
    });
  }

  return (
    <div className="mt-3">
      {msg ? (
        <p className="text-[11px] text-center text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">{msg}</p>
      ) : (
        <button onClick={handleCreate} disabled={pending}
          className="block w-full text-center border border-[#c4a882] text-[#8b6f5e] text-xs tracking-widest uppercase py-2.5 hover:bg-[#f5ede4] transition-colors disabled:opacity-50">
          {pending ? "Oluşturuluyor..." : "Site Hesabı Oluştur"}
        </button>
      )}
    </div>
  );
}
