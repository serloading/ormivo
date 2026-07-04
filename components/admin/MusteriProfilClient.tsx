"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomer, updateCustomerSegment, addCustomerNote, deleteCustomerNote } from "@/lib/actions/customer";
import { fmtOrderNo } from "@/lib/order-no";
import { adminAddAddress, adminDeleteAddress } from "@/lib/actions/address";
import { SEGMENTS, SEGMENT_LABELS, SEGMENT_COLORS } from "@/lib/customer-constants";
import { TURKEY_CITIES, CITY_NAMES } from "@/lib/data/turkey-cities";

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


const COUNTRY_CODES = [
  { code: "+90",  label: "🇹🇷 +90" },
  { code: "+1",   label: "🇺🇸 +1" },
  { code: "+44",  label: "🇬🇧 +44" },
  { code: "+49",  label: "🇩🇪 +49" },
  { code: "+33",  label: "🇫🇷 +33" },
  { code: "+31",  label: "🇳🇱 +31" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+966", label: "🇸🇦 +966" },
  { code: "+7",   label: "🇷🇺 +7" },
];

function toWaPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("90")) return d;
  if (d.startsWith("0"))  return "9" + d;
  return "90" + d;
}

type UserAddress = {
  id: string; recipientName: string; phone: string;
  addressLine: string; city: string; district: string | null; isDefault: boolean;
};

type CustomerData = {
  id: string; name: string; phone: string | null; email: string | null;
  city: string | null; address: string | null; note: string | null;
  segment: string | null; tags: string[];
  birthDate?: string | null;
  siteUserId?: string | null;
  addresses?: UserAddress[];
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

  // Telefondaki alan kodunu ve numarayı ayır
  const parsePhone = (raw: string | null) => {
    if (!raw) return { code: "+90", number: "" };
    for (const { code } of COUNTRY_CODES) {
      if (raw.startsWith(code)) return { code, number: raw.slice(code.length).trim() };
    }
    return { code: "+90", number: raw };
  };
  const parsedPhone = parsePhone(customer.phone ?? null);

  const [infoForm, setInfoForm] = useState({
    name:        customer.name,
    countryCode: parsedPhone.code,
    phone:       parsedPhone.number,
    email:       customer.email ?? "",
    city:        customer.city ?? "",
    address:     customer.address ?? "",
    district:    "",
    note:        customer.note ?? "",
    birthDate:   customer.birthDate ? new Date(customer.birthDate).toISOString().split("T")[0] : "",
  });
  const [infoSaving, startInfoT] = useTransition();

  const infoDistricts = infoForm.city && TURKEY_CITIES[infoForm.city] ? TURKEY_CITIES[infoForm.city] : [];

  function handleInfoSave(e: React.FormEvent) {
    e.preventDefault();
    const fullPhone = infoForm.phone.trim()
      ? (infoForm.countryCode + infoForm.phone.trim())
      : undefined;
    startInfoT(async () => {
      await updateCustomer(customer.id, {
        name:      infoForm.name.trim(),
        phone:     fullPhone,
        email:     infoForm.email.trim() || undefined,
        city:      infoForm.city || undefined,
        address:   infoForm.address.trim() || undefined,
        note:      infoForm.note.trim() || undefined,
        birthDate: infoForm.birthDate || undefined,
      });
      setEditingInfo(false);
      router.refresh();
    });
  }

  const [segment, setSegment] = useState(customer.segment ?? "");
  const [noteText, setNoteText] = useState("");

  function handleSegmentChange(val: string) {
    setSegment(val);
    startTransition(async () => {
      await updateCustomerSegment(customer.id, val || null);
      router.refresh();
    });
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
              {/* Ad Soyad */}
              <div>
                <label className="text-xs text-[#8b6f5e] block mb-0.5">Ad Soyad *</label>
                <input type="text" value={infoForm.name}
                  onChange={(e) => setInfoForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]" />
              </div>
              {/* Telefon + alan kodu */}
              <div>
                <label className="text-xs text-[#8b6f5e] block mb-0.5">Telefon</label>
                <div className="flex gap-1">
                  <select value={infoForm.countryCode}
                    onChange={(e) => setInfoForm((p) => ({ ...p, countryCode: e.target.value }))}
                    className="border border-[#d4c5ba] rounded-sm px-2 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]">
                    {COUNTRY_CODES.map(({ code, label }) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  <input type="tel" value={infoForm.phone} placeholder="5XX XXX XX XX"
                    onChange={(e) => setInfoForm((p) => ({ ...p, phone: e.target.value }))}
                    className="flex-1 border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]" />
                </div>
              </div>
              {/* E-posta */}
              <div>
                <label className="text-xs text-[#8b6f5e] block mb-0.5">E-posta</label>
                <input type="email" value={infoForm.email}
                  onChange={(e) => setInfoForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]" />
              </div>
              {/* İl */}
              <div>
                <label className="text-xs text-[#8b6f5e] block mb-0.5">Şehir (İl)</label>
                <select value={infoForm.city}
                  onChange={(e) => setInfoForm((p) => ({ ...p, city: e.target.value, district: "" }))}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]">
                  <option value="">Şehir seçin</option>
                  {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* İlçe */}
              <div>
                <label className="text-xs text-[#8b6f5e] block mb-0.5">İlçe</label>
                {infoDistricts.length > 0 ? (
                  <select value={infoForm.district}
                    onChange={(e) => setInfoForm((p) => ({ ...p, district: e.target.value }))}
                    className="w-full border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]">
                    <option value="">İlçe seçin</option>
                    {infoDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <input type="text" value={infoForm.district} placeholder="İlçe"
                    onChange={(e) => setInfoForm((p) => ({ ...p, district: e.target.value }))}
                    className="w-full border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]" />
                )}
              </div>
              {/* Adres satırı */}
              <div>
                <label className="text-xs text-[#8b6f5e] block mb-0.5">Adres</label>
                <input type="text" value={infoForm.address}
                  onChange={(e) => setInfoForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]" />
              </div>
              {/* Doğum tarihi */}
              <div>
                <label className="text-xs text-[#8b6f5e] block mb-0.5">Doğum Tarihi</label>
                <input type="date" value={infoForm.birthDate}
                  onChange={(e) => setInfoForm((p) => ({ ...p, birthDate: e.target.value }))}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]" />
              </div>
              {/* Not */}
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
                  ["Telefon",       customer.phone   || "—"],
                  ["E-posta",      customer.email   || "—"],
                  ["Adres",        customer.address || "—"],
                  ["Doğum Tarihi", customer.birthDate ? new Date(customer.birthDate).toLocaleDateString("tr-TR") : "—"],
                  ["Not",          customer.note    || "—"],
                  ["Kayıt",        new Date(customer.createdAt).toLocaleDateString("tr-TR")],
                  ["Son Sipariş",  lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString("tr-TR") : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm border-b border-[#f0ebe6] pb-2 last:border-0">
                    <span className="text-[#8b6f5e]">{k}</span>
                    <span className="text-[#2c1810] font-medium text-right max-w-[160px] break-words">{v}</span>
                  </div>
                ))}
              </div>
              {customer.phone && (
                <a href={`https://wa.me/${toWaPhone(customer.phone)}`} target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase py-2.5 hover:bg-[#3d2418] transition-colors mt-4">
                  WhatsApp&apos;tan Yaz
                </a>
              )}
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

        {/* Adresler */}
        <AddressSection siteUserId={customer.siteUserId ?? null} addresses={customer.addresses ?? []} />
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
                        #{fmtOrderNo(o.orderNo)}
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

function AddressSection({ siteUserId, addresses }: { siteUserId: string | null; addresses: UserAddress[] }) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [city, setCity] = useState("");
  const [form, setForm] = useState({ recipientName: "", phone: "", addressLine: "", district: "", isDefault: false });

  const districts = city && TURKEY_CITIES[city] ? TURKEY_CITIES[city] : [];

  function handleDelete(id: string) {
    if (!confirm("Bu adres silinsin mi?")) return;
    startT(async () => { await adminDeleteAddress(id); router.refresh(); });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!siteUserId) return alert("Bu müşterinin site hesabı henüz oluşturulmamış. Önce site hesabı oluşturun.");
    if (!form.recipientName || !form.phone || !form.addressLine || !city) return;
    await adminAddAddress(siteUserId, { ...form, city, district: form.district || null });
    setShowForm(false);
    setForm({ recipientName: "", phone: "", addressLine: "", district: "", isDefault: false });
    setCity("");
    router.refresh();
  }

  const inp = "w-full border border-[#d4c5ba] rounded-sm px-3 py-1.5 text-sm bg-[#faf8f6] focus:outline-none focus:border-[#8b6f5e]";

  return (
    <div className="bg-white border border-[#e8ddd6] rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs tracking-widest text-[#5c4033] uppercase">Adresler</h3>
        <button onClick={() => setShowForm((p) => !p)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810] underline">
          {showForm ? "İptal" : "+ Adres Ekle"}
        </button>
      </div>

      {addresses.length === 0 && !showForm && (
        <p className="text-xs text-[#b8a89e]">Kayıtlı adres yok.</p>
      )}

      <div className="space-y-3 mb-3">
        {addresses.map((a) => (
          <div key={a.id} className="border border-[#f0ebe6] rounded-sm p-3 text-xs">
            <div className="flex justify-between items-start">
              <div>
                {a.isDefault && <span className="text-[10px] bg-[#f0ebe6] text-[#8b6f5e] px-1.5 py-0.5 rounded mr-1">Varsayılan</span>}
                <span className="font-medium text-[#2c1810]">{a.recipientName}</span> · {a.phone}
                <p className="text-[#5c4033] mt-0.5">{a.addressLine}</p>
                <p className="text-[#8b6f5e]">{[a.district, a.city].filter(Boolean).join(", ")}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600 ml-2">Sil</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-2 border-t border-[#f0ebe6] pt-3">
          {[
            { label: "Alıcı Adı *", key: "recipientName", type: "text" },
            { label: "Telefon *",   key: "phone",          type: "tel" },
            { label: "Adres *",     key: "addressLine",    type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-[10px] text-[#8b6f5e] block mb-0.5">{label}</label>
              <input type={type} value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                required className={inp} />
            </div>
          ))}
          <div>
            <label className="text-[10px] text-[#8b6f5e] block mb-0.5">Şehir *</label>
            <select value={city} onChange={(e) => { setCity(e.target.value); setForm((p) => ({ ...p, district: "" })); }} required className={inp}>
              <option value="">Şehir seçin</option>
              {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#8b6f5e] block mb-0.5">İlçe</label>
            {districts.length > 0 ? (
              <select value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} className={inp}>
                <option value="">İlçe seçin</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input type="text" value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} placeholder="İlçe" className={inp} />
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-[#5c4033]">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} />
            Varsayılan olarak kaydet
          </label>
          <button type="submit" className="w-full bg-[#2c1810] text-[#f5f0eb] text-xs py-2 hover:bg-[#3d2418] transition-colors">
            Adresi Kaydet
          </button>
        </form>
      )}
    </div>
  );
}

