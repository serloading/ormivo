"use client";

import { useState, useTransition } from "react";
import {
  updateSiteOrderStatus, updateTrackingNo, updatePaymentStatus,
  updateDeliveryMethod, updateSiteOrderDiscount,
  updateManuelOrderPayment, updateManuelOrderTotal,
} from "@/lib/actions/site-order-admin";
import { createOrder } from "@/lib/actions/order";

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

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Ödeme Bekliyor",
  PAID:    "Ödeme Alındı",
  FREE:    "Ücretsiz",
};

const PAYMENT_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID:    "bg-green-50 text-green-700 border-green-200",
  FREE:    "bg-purple-50 text-purple-700 border-purple-200",
};

const DELIVERY_LABELS: Record<string, string> = {
  CARGO:  "Kargo",
  PICKUP: "Ofisten Teslim",
};

const DELIVERY_COLORS: Record<string, string> = {
  CARGO:  "bg-blue-50 text-blue-700 border-blue-200",
  PICKUP: "bg-teal-50 text-teal-700 border-teal-200",
};

interface OrderRow {
  id: string;
  source: "web" | "manuel";
  orderNo: string;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  createdAt: string;
  recipientName: string | null;
  recipientPhone: string | null;
  addressLine: string | null;
  city: string | null;
  district: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number;
  discount: number;
  note: string | null;
  trackingNo: string | null;
  cargoCompany: string | null;
  memberName: string | null;
  memberPhone: string | null;
}

interface Customer { id: string; name: string; phone: string | null }

// ---- Inline Editors ----

function Dropdown({ label, colorCls, children, disabled }: {
  label: string; colorCls: string; children: React.ReactNode; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)} disabled={disabled}
        className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border font-medium transition-opacity ${colorCls} ${disabled ? "opacity-50" : "hover:opacity-80 cursor-pointer"}`}
      >
        {label} ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-6 left-0 z-20 bg-white border border-gray-200 rounded shadow-lg min-w-[160px]">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function StatusEditor({ order }: { order: OrderRow }) {
  const [pending, startTransition] = useTransition();
  const [cur, setCur] = useState(order.status);

  function handleChange(status: string) {
    startTransition(async () => {
      if (order.source === "web") {
        await updateSiteOrderStatus(order.id, status);
      }
      setCur(status);
    });
  }

  if (order.source === "manuel") {
    return (
      <span className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border font-medium ${STATUS_COLORS[cur] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
        {STATUS_LABELS[cur] ?? cur}
      </span>
    );
  }

  return (
    <Dropdown label={STATUS_LABELS[cur] ?? cur} colorCls={STATUS_COLORS[cur] ?? "bg-gray-100 text-gray-600 border-gray-200"} disabled={pending}>
      {Object.entries(STATUS_LABELS).map(([key, label]) => (
        <button key={key} onClick={() => handleChange(key)}
          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${cur === key ? "font-semibold text-indigo-600" : "text-gray-700"}`}>
          {label}
        </button>
      ))}
    </Dropdown>
  );
}

function PaymentEditor({ order }: { order: OrderRow }) {
  const [pending, startTransition] = useTransition();
  const [cur, setCur] = useState(order.paymentStatus);

  function handleChange(status: string) {
    startTransition(async () => {
      if (order.source === "web") {
        await updatePaymentStatus(order.id, status);
      } else {
        await updateManuelOrderPayment(order.id, status);
      }
      setCur(status);
    });
  }

  const options = order.source === "web"
    ? PAYMENT_LABELS
    : { PENDING: "Ödeme Bekliyor", PAID: "Ödeme Alındı" };

  return (
    <Dropdown label={PAYMENT_LABELS[cur] ?? cur} colorCls={PAYMENT_COLORS[cur] ?? "bg-gray-100 text-gray-600 border-gray-200"} disabled={pending}>
      {Object.entries(options).map(([key, label]) => (
        <button key={key} onClick={() => handleChange(key)}
          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${cur === key ? "font-semibold text-indigo-600" : "text-gray-700"}`}>
          {label}
        </button>
      ))}
    </Dropdown>
  );
}

function DeliveryEditor({ order }: { order: OrderRow }) {
  const [pending, startTransition] = useTransition();
  const [cur, setCur] = useState(order.deliveryMethod);

  if (order.source === "manuel") {
    return (
      <span className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border font-medium ${DELIVERY_COLORS["PICKUP"]}`}>
        Ofisten Teslim
      </span>
    );
  }

  function handleChange(method: string) {
    startTransition(async () => {
      await updateDeliveryMethod(order.id, method);
      setCur(method);
    });
  }

  return (
    <Dropdown label={DELIVERY_LABELS[cur] ?? cur} colorCls={DELIVERY_COLORS[cur] ?? "bg-gray-100 text-gray-600 border-gray-200"} disabled={pending}>
      {Object.entries(DELIVERY_LABELS).map(([key, label]) => (
        <button key={key} onClick={() => handleChange(key)}
          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${cur === key ? "font-semibold text-indigo-600" : "text-gray-700"}`}>
          {label} {key === "CARGO" && <span className="text-gray-400">(+200₺ gider)</span>}
        </button>
      ))}
    </Dropdown>
  );
}

function DiscountEditor({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(order.discount || ""));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (order.source === "manuel") return null;

  function handleSave() {
    startTransition(async () => {
      await updateSiteOrderDiscount(order.id, Number(value) || 0);
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1000);
    });
  }

  const disc = Number(value) || order.discount;

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className={`text-[10px] px-2 py-0.5 rounded border font-medium whitespace-nowrap ${disc > 0 ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"}`}>
          {disc > 0 ? `−${disc.toLocaleString("tr-TR")}₺` : "İskonto ekle"}
        </button>
      ) : (
        <div className="flex gap-1 items-center">
          <input
            type="number" min="0" value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            className="border border-gray-200 rounded px-1.5 py-0.5 text-xs w-20 focus:outline-none focus:border-indigo-400"
          />
          <span className="text-xs text-gray-400">₺</span>
          <button onClick={handleSave} disabled={pending}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${saved ? "bg-green-500 text-white" : "bg-indigo-600 text-white"} disabled:opacity-60`}>
            {saved ? "✓" : "Kaydet"}
          </button>
          <button onClick={() => setOpen(false)} className="text-[10px] text-gray-400">✕</button>
        </div>
      )}
    </div>
  );
}

function TotalEditor({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(order.total));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (order.source === "web") return null;

  function handleSave() {
    startTransition(async () => {
      await updateManuelOrderTotal(order.id, Number(value));
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1000);
    });
  }

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="font-bold text-gray-800 hover:text-indigo-600 text-sm whitespace-nowrap">
          {order.total.toLocaleString("tr-TR")} ₺ ✏️
        </button>
      ) : (
        <div className="flex gap-1 items-center">
          <input
            type="number" min="0" value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border border-gray-200 rounded px-1.5 py-0.5 text-xs w-24 focus:outline-none focus:border-indigo-400"
          />
          <button onClick={handleSave} disabled={pending}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${saved ? "bg-green-500 text-white" : "bg-indigo-600 text-white"} disabled:opacity-60`}>
            {saved ? "✓" : "Kaydet"}
          </button>
          <button onClick={() => setOpen(false)} className="text-[10px] text-gray-400">✕</button>
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
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap">
          {order.trackingNo ? <><div className="text-[10px] text-gray-500">{order.cargoCompany}</div><div>{order.trackingNo}</div></> : "Takip Ekle"}
        </button>
      ) : (
        <div className="space-y-1.5 min-w-[160px]">
          <input value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)}
            placeholder="Takip no"
            className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-indigo-400" />
          <select value={company} onChange={(e) => setCompany(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-indigo-400">
            <option value="">Firma seç</option>
            {["Yurtiçi Kargo", "MNG Kargo", "Aras Kargo", "PTT Kargo", "Sürat Kargo", "DHL", "UPS"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <button onClick={handleSave} disabled={pending}
              className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${saved ? "bg-green-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"} disabled:opacity-60`}>
              {saved ? "✓" : pending ? "…" : "Kaydet"}
            </button>
            <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- New Manuel Order Form ----

interface OrderItemForm { name: string; qty: number; price: number }

function NewOrderModal({ customers, onClose }: { customers: Customer[]; onClose: () => void }) {
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<OrderItemForm[]>([{ name: "", qty: 1, price: 0 }]);
  const [manualTotal, setManualTotal] = useState("");
  const [useManualTotal, setUseManualTotal] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const autoTotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const total = useManualTotal ? Number(manualTotal) || 0 : autoTotal;

  function setItem(idx: number, field: keyof OrderItemForm, val: string | number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "", qty: 1, price: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const resolvedCustomerId = customerId || null;
    if (!resolvedCustomerId && !customerName.trim()) {
      setError("Müşteri seçin veya isim girin.");
      return;
    }
    if (items.some((i) => !i.name.trim())) {
      setError("Tüm ürün isimlerini doldurun.");
      return;
    }

    startTransition(async () => {
      // If customerName typed but not in list, we use first matching or need to create
      // For simplicity, require existing customer selection
      if (!resolvedCustomerId) {
        setError("Lütfen listeden müşteri seçin.");
        return;
      }
      await createOrder({
        customerId: resolvedCustomerId,
        items: items.map((i) => ({ productName: i.name, price: i.price, quantity: i.qty })),
        total,
        note: note.trim() || undefined,
      });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Yeni Manuel Sipariş</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Müşteri */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Müşteri</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
              <option value="">Müşteri seçin...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>
              ))}
            </select>
          </div>

          {/* Ürünler */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ürünler</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    value={item.name} onChange={(e) => setItem(idx, "name", e.target.value)}
                    placeholder="Ürün adı" required
                    className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                  />
                  <input
                    type="number" min="1" value={item.qty} onChange={(e) => setItem(idx, "qty", Number(e.target.value))}
                    className="w-14 border border-gray-200 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-indigo-400"
                    placeholder="Adet"
                  />
                  <input
                    type="number" min="0" value={item.price} onChange={(e) => setItem(idx, "price", Number(e.target.value))}
                    className="w-24 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="Fiyat ₺"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Ürün Ekle</button>
          </div>

          {/* Toplam */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <label className="text-xs font-medium text-gray-600">Toplam</label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={useManualTotal} onChange={(e) => setUseManualTotal(e.target.checked)}
                  className="rounded" />
                Manuel tutar gir
              </label>
            </div>
            {useManualTotal ? (
              <input
                type="number" min="0" value={manualTotal}
                onChange={(e) => setManualTotal(e.target.value)}
                placeholder="Toplam tutar"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
              />
            ) : (
              <div className="text-base font-bold text-gray-800">{autoTotal.toLocaleString("tr-TR")} ₺</div>
            )}
          </div>

          {/* Not */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Not (opsiyonel)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
              placeholder="Sipariş notu..." />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={pending}
              className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
              {pending ? "Kaydediliyor..." : "Siparişi Oluştur"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Main Component ----

export default function SiparislerClient({
  orders,
  customers,
}: {
  orders: OrderRow[];
  customers: Customer[];
}) {
  const [filter, setFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(false);

  const filtered = orders.filter((o) => {
    const q = filter.toLowerCase();
    const matchQ = !q || o.orderNo.toLowerCase().includes(q) ||
      (o.recipientName ?? "").toLowerCase().includes(q) ||
      (o.recipientPhone ?? "").includes(q);
    const matchSource = !sourceFilter || o.source === sourceFilter;
    return matchQ && matchSource;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-800">Siparişler</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{filtered.length} sipariş</span>
          <button
            onClick={() => setShowNewOrder(true)}
            className="bg-indigo-600 text-white text-xs px-4 py-2 rounded font-medium hover:bg-indigo-700 transition-colors"
          >
            + Yeni Sipariş
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Sipariş no, isim veya telefon..."
          className="border border-gray-200 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:border-indigo-400"
        />
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
          <option value="">Tüm Kaynaklar</option>
          <option value="web">Web</option>
          <option value="manuel">Manuel</option>
        </select>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Sipariş</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Ürünler</th>
              <th className="px-4 py-3">Tutar</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Ödeme</th>
              <th className="px-4 py-3">Teslimat</th>
              <th className="px-4 py-3">Kargo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-gray-400 text-sm">Sipariş bulunamadı.</td>
              </tr>
            )}
            {filtered.map((order) => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/60 align-top">
                {/* Sipariş No + Tarih + Kaynak */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-mono text-xs font-semibold text-gray-700">#{order.orderNo}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "2-digit" })}
                  </div>
                  <span className={`inline-block mt-1 text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded font-medium ${
                    order.source === "web" ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}>
                    {order.source === "web" ? "Web" : "Manuel"}
                  </span>
                </td>

                {/* Müşteri */}
                <td className="px-4 py-3">
                  <div className="text-xs font-medium text-gray-700">{order.recipientName}</div>
                  {order.recipientPhone && <div className="text-[10px] text-gray-400">{order.recipientPhone}</div>}
                  {order.city && <div className="text-[10px] text-gray-400">{[order.district, order.city].filter(Boolean).join(", ")}</div>}
                  {order.note && (
                    <div className="text-[10px] text-orange-500 mt-0.5 max-w-[140px]" title={order.note}>
                      Not: {order.note}
                    </div>
                  )}
                </td>

                {/* Ürünler */}
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="text-xs text-gray-600">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-400 ml-1">×{item.qty}</span>
                        <span className="text-gray-500 ml-1">{(item.price * item.qty).toLocaleString("tr-TR")}₺</span>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Tutar + İskonto */}
                <td className="px-4 py-3">
                  {order.source === "web" ? (
                    <div>
                      <div className="font-bold text-gray-800 text-sm whitespace-nowrap">{order.total.toLocaleString("tr-TR")} ₺</div>
                      <div className="mt-1">
                        <DiscountEditor order={order} />
                      </div>
                      {order.discount > 0 && (
                        <div className="text-[10px] text-green-700 mt-0.5 font-medium">
                          Net: {(order.total - order.discount).toLocaleString("tr-TR")} ₺
                        </div>
                      )}
                    </div>
                  ) : (
                    <TotalEditor order={order} />
                  )}
                </td>

                {/* Durum */}
                <td className="px-4 py-3">
                  <StatusEditor order={order} />
                </td>

                {/* Ödeme */}
                <td className="px-4 py-3">
                  <PaymentEditor order={order} />
                </td>

                {/* Teslimat */}
                <td className="px-4 py-3">
                  <DeliveryEditor order={order} />
                </td>

                {/* Kargo takip */}
                <td className="px-4 py-3">
                  <TrackingForm order={order} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNewOrder && (
        <NewOrderModal customers={customers} onClose={() => setShowNewOrder(false)} />
      )}
    </div>
  );
}
