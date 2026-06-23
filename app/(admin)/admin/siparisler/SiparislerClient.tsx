"use client";

import { useState, useTransition } from "react";
import { updateSiteOrderStatus, updateTrackingNo } from "@/lib/actions/site-order-admin";

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Hazırlanıyor",
  CONFIRMED: "Onaylandı",
  SHIPPED:   "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

interface OrderRow {
  id: string;
  source: "web" | "manuel";
  orderNo: string;
  status: string;
  createdAt: string;
  recipientName: string | null;
  recipientPhone: string | null;
  addressLine: string | null;
  city: string | null;
  district: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number;
  note: string | null;
  trackingNo: string | null;
  cargoCompany: string | null;
  memberName: string | null;
  memberPhone: string | null;
}

function StatusEditor({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (order.source === "manuel") {
    return (
      <span className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
        {STATUS_LABELS[order.status] ?? order.status}
      </span>
    );
  }

  function handleChange(status: string) {
    startTransition(async () => {
      await updateSiteOrderStatus(order.id, status);
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1000);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border font-medium transition-opacity ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600 border-gray-200"} ${pending ? "opacity-50" : "hover:opacity-80 cursor-pointer"}`}
      >
        {saved ? "✓ Kaydedildi" : (STATUS_LABELS[order.status] ?? order.status)} ▾
      </button>
      {open && (
        <div className="absolute top-7 left-0 z-10 bg-white border border-gray-200 rounded shadow-lg min-w-[160px]">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleChange(key)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${order.status === key ? "font-semibold text-indigo-600" : "text-gray-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackingForm({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  const [trackingNo, setTrackingNo] = useState(order.trackingNo ?? "");
  const [company, setCompany] = useState(order.cargoCompany ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (order.source === "manuel") return null;

  function handleSave() {
    startTransition(async () => {
      await updateTrackingNo(order.id, trackingNo, company);
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
    });
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
          {order.trackingNo ? `Kargo: ${order.trackingNo}` : "Kargo Takip Ekle"}
        </button>
      ) : (
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Takip No</label>
            <input value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="123456789"
              className="border border-gray-200 rounded px-2 py-1.5 text-sm w-36 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Kargo Firması</label>
            <select value={company} onChange={(e) => setCompany(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400">
              <option value="">Seçin</option>
              {["Yurtiçi Kargo", "MNG Kargo", "Aras Kargo", "PTT Kargo", "Sürat Kargo", "DHL", "UPS"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSave} disabled={pending}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${saved ? "bg-green-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"} disabled:opacity-60`}>
            {saved ? "Kaydedildi ✓" : pending ? "…" : "Kaydet"}
          </button>
          <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">İptal</button>
        </div>
      )}
    </div>
  );
}

export default function SiparislerClient({ orders }: { orders: OrderRow[] }) {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const filtered = orders.filter((o) => {
    const q = filter.toLowerCase();
    const matchQ = !q || o.orderNo.toLowerCase().includes(q) ||
      (o.recipientName ?? "").toLowerCase().includes(q) ||
      (o.recipientPhone ?? "").includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchSource = !sourceFilter || o.source === sourceFilter;
    return matchQ && matchStatus && matchSource;
  });

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Siparişler</h1>
        <span className="text-sm text-gray-500">{orders.length} sipariş</span>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Sipariş no, isim veya telefon..."
          className="border border-gray-200 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:border-indigo-400"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
          <option value="">Tüm Kaynaklar</option>
          <option value="web">Web</option>
          <option value="manuel">Manuel</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">Sipariş bulunamadı.</div>
        )}
        {filtered.map((order) => (
          <div key={order.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap items-start gap-4 justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-gray-700">#{order.orderNo}</span>

                  {/* Kaynak etiketi */}
                  <span className={`text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded font-medium ${
                    order.source === "web" ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}>
                    {order.source === "web" ? "Web" : "Manuel"}
                  </span>

                  {/* Durum — tıklanabilir dropdown (sadece web siparişleri) */}
                  <StatusEditor order={order} />

                  <span className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-gray-600 mb-2">
                  <span><span className="text-gray-400">Alıcı:</span> {order.recipientName}</span>
                  {order.recipientPhone && <span><span className="text-gray-400">Tel:</span> {order.recipientPhone}</span>}
                  {(order.addressLine || order.city) && (
                    <span className="sm:col-span-2">
                      <span className="text-gray-400">Adres:</span> {[order.addressLine, order.district, order.city].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {order.note && <span className="sm:col-span-2"><span className="text-gray-400">Not:</span> {order.note}</span>}
                  {order.memberName && <span><span className="text-gray-400">Üye:</span> {order.memberName} ({order.memberPhone})</span>}
                </div>

                <div className="space-y-0.5">
                  {order.items.map((item, i) => (
                    <p key={i} className="text-xs text-gray-500">
                      {item.name} <span className="text-gray-400">×{item.qty}</span>
                      <span className="ml-2 text-gray-600 font-medium">{(item.price * item.qty).toLocaleString("tr-TR")} ₺</span>
                    </p>
                  ))}
                </div>

                <TrackingForm order={order} />
              </div>

              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-gray-800">{order.total.toLocaleString("tr-TR")} ₺</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
