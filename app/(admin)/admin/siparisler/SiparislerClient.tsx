"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  updateSiteOrderStatus, updateManuelOrderStatus, updateTrackingNo, updatePaymentStatus,
  updateDeliveryMethod, updateSiteOrderDiscount,
  updateManuelOrderPayment, updateManuelOrderTotal, updateManuelOrderDelivery,
  updateOrderItems, deleteOrderById,
} from "@/lib/actions/site-order-admin";
import { createOrder } from "@/lib/actions/order";
import { createCustomer } from "@/lib/actions/customer";
import { createProduct } from "@/lib/actions/product";

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Beklemede",
  SHIPPED:   "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
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
const DELIVERY_LABELS: Record<string, string> = { CARGO: "Kargo", PICKUP: "Ofisten Teslim" };
const DELIVERY_COLORS: Record<string, string> = {
  CARGO:  "bg-blue-50 text-blue-700 border-blue-200",
  PICKUP: "bg-teal-50 text-teal-700 border-teal-200",
};

interface OrderRow {
  id: string; source: "web" | "manuel"; orderNo: string; status: string;
  paymentStatus: string; deliveryMethod: string; createdAt: string;
  recipientName: string | null; recipientPhone: string | null;
  addressLine: string | null; city: string | null; district: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number; discount: number; note: string | null;
  trackingNo: string | null; cargoCompany: string | null;
  memberName: string | null; memberPhone: string | null;
}
interface Customer { id: string; name: string; phone: string | null }
interface ProductOption { id: string; name: string; price: number; stock: number }
interface CatBrand { id: string; name: string }

// ---- Portal Dropdown ----
// Renders the menu via portal so it floats above the table without z-index clipping

function PortalDropdown({ label, colorCls, options, onSelect, current, disabled }: {
  label: string; colorCls: string; disabled?: boolean;
  options: { key: string; label: string; extra?: string }[];
  onSelect: (key: string) => void;
  current: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setOpen(true);
  }

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);

  return (
    <>
      <button ref={btnRef} onClick={handleOpen} disabled={disabled}
        className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border font-medium whitespace-nowrap ${colorCls} ${disabled ? "opacity-50" : "hover:opacity-80 cursor-pointer"}`}>
        {label} ▾
      </button>
      {open && typeof window !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="absolute z-[9999] bg-white border border-gray-200 rounded shadow-xl min-w-[170px]"
            style={{ top: pos.top, left: pos.left }}>
            {options.map(({ key, label: optLabel, extra }) => (
              <button key={key}
                onClick={() => { onSelect(key); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between ${current === key ? "font-semibold text-indigo-600" : "text-gray-700"}`}>
                <span>{optLabel}</span>
                {extra && <span className="text-gray-400 text-[10px] ml-2">{extra}</span>}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ---- Inline Editors ----

function StatusEditor({ order }: { order: OrderRow }) {
  const [pending, startTransition] = useTransition();
  const [cur, setCur] = useState(order.status);

  return (
    <PortalDropdown
      label={STATUS_LABELS[cur] ?? cur}
      colorCls={STATUS_COLORS[cur] ?? "bg-gray-100 text-gray-600 border-gray-200"}
      disabled={pending}
      current={cur}
      options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ key: k, label: v }))}
      onSelect={(key) => {
        startTransition(async () => {
          if (order.source === "web") await updateSiteOrderStatus(order.id, key);
          else await updateManuelOrderStatus(order.id, key);
          setCur(key);
        });
      }}
    />
  );
}

function PaymentEditor({ order }: { order: OrderRow }) {
  const [pending, startTransition] = useTransition();
  const [cur, setCur] = useState(order.paymentStatus);

  const opts = order.source === "web"
    ? Object.entries(PAYMENT_LABELS).map(([k, v]) => ({ key: k, label: v }))
    : [{ key: "PENDING", label: "Ödeme Bekliyor" }, { key: "PAID", label: "Ödeme Alındı" }];

  return (
    <PortalDropdown
      label={PAYMENT_LABELS[cur] ?? cur}
      colorCls={PAYMENT_COLORS[cur] ?? "bg-gray-100 text-gray-600 border-gray-200"}
      disabled={pending}
      current={cur}
      options={opts}
      onSelect={(key) => {
        startTransition(async () => {
          if (order.source === "web") await updatePaymentStatus(order.id, key);
          else await updateManuelOrderPayment(order.id, key);
          setCur(key);
        });
      }}
    />
  );
}

function DeliveryEditor({ order }: { order: OrderRow }) {
  const [pending, startTransition] = useTransition();
  const [cur, setCur] = useState(order.deliveryMethod);

  return (
    <PortalDropdown
      label={DELIVERY_LABELS[cur] ?? cur}
      colorCls={DELIVERY_COLORS[cur] ?? "bg-gray-100 text-gray-600 border-gray-200"}
      disabled={pending}
      current={cur}
      options={Object.entries(DELIVERY_LABELS).map(([k, v]) => ({
        key: k, label: v,
        extra: k === "CARGO" && order.source === "web" ? "+200₺ gider" : undefined,
      }))}
      onSelect={(key) => {
        startTransition(async () => {
          if (order.source === "web") await updateDeliveryMethod(order.id, key);
          else await updateManuelOrderDelivery(order.id, key);
          setCur(key);
        });
      }}
    />
  );
}

function DiscountEditor({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(order.discount || ""));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (order.source === "manuel") return null;

  const disc = open ? (Number(value) || 0) : order.discount;

  function handleSave() {
    startTransition(async () => {
      await updateSiteOrderDiscount(order.id, Number(value) || 0);
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1000);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className={`text-[10px] px-2 py-0.5 rounded border font-medium whitespace-nowrap ${disc > 0 ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"}`}>
        {disc > 0 ? `−${disc.toLocaleString("tr-TR")}₺` : "İskonto ekle"}
      </button>
    );
  }

  return (
    <div className="flex gap-1 items-center">
      <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)}
        placeholder="0" autoFocus
        className="border border-gray-200 rounded px-1.5 py-0.5 text-xs w-20 focus:outline-none focus:border-indigo-400" />
      <span className="text-xs text-gray-400">₺</span>
      <button onClick={handleSave} disabled={pending}
        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${saved ? "bg-green-500 text-white" : "bg-indigo-600 text-white"} disabled:opacity-60`}>
        {saved ? "✓" : "Kaydet"}
      </button>
      <button onClick={() => setOpen(false)} className="text-[10px] text-gray-400">✕</button>
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

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="font-bold text-gray-800 hover:text-indigo-600 text-sm whitespace-nowrap group">
        {order.total.toLocaleString("tr-TR")} ₺ <span className="opacity-0 group-hover:opacity-100 text-xs">✏️</span>
      </button>
    );
  }

  return (
    <div className="flex gap-1 items-center">
      <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} autoFocus
        className="border border-gray-200 rounded px-1.5 py-0.5 text-xs w-24 focus:outline-none focus:border-indigo-400" />
      <button onClick={handleSave} disabled={pending}
        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${saved ? "bg-green-500 text-white" : "bg-indigo-600 text-white"} disabled:opacity-60`}>
        {saved ? "✓" : "Kaydet"}
      </button>
      <button onClick={() => setOpen(false)} className="text-[10px] text-gray-400">✕</button>
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

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap">
        {order.trackingNo
          ? <><div className="text-[10px] text-gray-500">{order.cargoCompany}</div><div>{order.trackingNo}</div></>
          : "Takip Ekle"}
      </button>
    );
  }

  return (
    <div className="space-y-1.5 min-w-[160px]">
      <input value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="Takip no" autoFocus
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
          className={`flex-1 px-2 py-1 rounded text-xs font-medium ${saved ? "bg-green-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"} disabled:opacity-60`}>
          {saved ? "✓" : pending ? "…" : "Kaydet"}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
      </div>
    </div>
  );
}

// ---- Product Autocomplete Input ----

interface ItemForm { productId: string | null; name: string; qty: number; price: number }

function ProductInput({
  item, idx, products, onChange,
}: {
  item: ItemForm;
  idx: number;
  products: ProductOption[];
  onChange: (idx: number, field: keyof ItemForm, val: string | number | null) => void;
}) {
  const [query, setQuery] = useState(item.name);
  const [showSug, setShowSug] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = query.trim().length > 0
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  function select(p: ProductOption) {
    setQuery(p.name);
    setShowSug(false);
    onChange(idx, "name", p.name);
    onChange(idx, "productId", p.id);
    onChange(idx, "price", p.price);
  }

  function handleBlur(e: React.FocusEvent) {
    if (wrapRef.current?.contains(e.relatedTarget as Node)) return;
    setShowSug(false);
    onChange(idx, "name", query);
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowSug(true); onChange(idx, "name", e.target.value); onChange(idx, "productId", null); }}
        onFocus={() => setShowSug(true)}
        onBlur={handleBlur}
        placeholder="Ürün adı ara..."
        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
      />
      {showSug && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto mt-0.5">
          {suggestions.map((p) => (
            <button key={p.id} type="button" onMouseDown={() => select(p)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between">
              <span className="font-medium text-gray-800">{p.name}</span>
              <span className="text-gray-500 ml-2 whitespace-nowrap">
                {p.price.toLocaleString("tr-TR")}₺
                {" · "}
                <span className={p.stock <= 0 ? "text-red-500" : "text-green-600"}>
                  Stok: {p.stock}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- New Manuel Order Modal ----

function NewOrderModal({ customers: initCustomers, products: initProducts, categories, brands, onClose }: {
  customers: Customer[];
  products: ProductOption[];
  categories: CatBrand[];
  brands: CatBrand[];
  onClose: () => void;
}) {
  const [customers, setCustomers] = useState(initCustomers);
  const [products, setProducts] = useState(initProducts);
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [deliveryMethod, setDeliveryMethod] = useState("PICKUP");
  const [discount, setDiscount] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ItemForm[]>([{ productId: null, name: "", qty: 1, price: 0 }]);
  const [useManualTotal, setUseManualTotal] = useState(false);
  const [manualTotal, setManualTotal] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Inline new customer
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "" });
  const [custSaving, startCustT] = useTransition();

  // Inline new product
  const [newProductIdx, setNewProductIdx] = useState<number | null>(null);
  const [newProd, setNewProd] = useState({ name: "", price: "", costPrice: "", categoryId: "", brandId: "" });
  const [prodSaving, startProdT] = useTransition();

  function changeItem(idx: number, field: keyof ItemForm, val: string | number | null) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }

  function saveNewCustomer() {
    if (!newCust.name.trim()) return;
    startCustT(async () => {
      const result = await createCustomer({ name: newCust.name.trim(), phone: newCust.phone.trim() || undefined });
      const newCustomer: Customer = { id: result.id, name: newCust.name.trim(), phone: newCust.phone.trim() || null };
      setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      setCustomerId(result.id);
      setNewCust({ name: "", phone: "" });
      setShowNewCustomer(false);
    });
  }

  function saveNewProduct(idx: number) {
    if (!newProd.name.trim() || !newProd.price) return;
    startProdT(async () => {
      const slug = newProd.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      await createProduct({
        name: newProd.name.trim(),
        slug: `${slug}-${Date.now()}`,
        description: "",
        price: Number(newProd.price),
        costPrice: newProd.costPrice ? Number(newProd.costPrice) : undefined,
        categoryId: newProd.categoryId || undefined,
        brandId: newProd.brandId || undefined,
        stock: 0,
        isActive: true,
        images: [],
      });
      const newP: ProductOption = { id: `temp-${Date.now()}`, name: newProd.name.trim(), price: Number(newProd.price), stock: 0 };
      setProducts((prev) => [...prev, newP]);
      changeItem(idx, "name", newP.name);
      changeItem(idx, "price", newP.price);
      setNewProd({ name: "", price: "", costPrice: "", categoryId: "", brandId: "" });
      setNewProductIdx(null);
    });
  }

  const autoTotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const grossTotal = useManualTotal ? (Number(manualTotal) || 0) : autoTotal;
  const discountAmt = Number(discount) || 0;
  const netTotal = Math.max(0, grossTotal - discountAmt);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!customerId) { setError("Müşteri seçin."); return; }
    if (items.some((i) => !i.name.trim())) { setError("Tüm ürün isimlerini doldurun."); return; }

    startTransition(async () => {
      await createOrder({
        customerId,
        items: items.map((i) => ({ productId: i.productId ?? undefined, productName: i.name, price: i.price, quantity: i.qty })),
        total: netTotal,
        discount: discountAmt,
        note: note.trim() || undefined,
        status,
        deliveryMethod,
        orderDate,
      });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-800">Yeni Manuel Sipariş</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Müşteri */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Müşteri *</label>
              {showNewCustomer ? (
                <div className="border border-indigo-200 rounded p-3 bg-indigo-50 space-y-2">
                  <p className="text-xs font-medium text-indigo-700">Yeni Müşteri</p>
                  <input value={newCust.name} onChange={(e) => setNewCust((p) => ({ ...p, name: e.target.value }))}
                    placeholder="İsim *" autoFocus
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400" />
                  <input value={newCust.phone} onChange={(e) => setNewCust((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Telefon (opsiyonel)"
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400" />
                  <div className="flex gap-2">
                    <button type="button" onClick={saveNewCustomer} disabled={!newCust.name.trim() || custSaving}
                      className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded disabled:opacity-60">
                      {custSaving ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                    <button type="button" onClick={() => setShowNewCustomer(false)} className="text-xs text-gray-400 px-2">İptal</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    <option value="">Müşteri seçin...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowNewCustomer(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    + Yeni müşteri ekle
                  </button>
                </div>
              )}
            </div>

            {/* Sipariş Durumu */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sipariş Durumu</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Sipariş Tarihi */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sipariş Tarihi</label>
            <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </div>

          {/* Teslimat Yöntemi */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Teslimat Yöntemi</label>
            <div className="flex gap-3">
              {Object.entries(DELIVERY_LABELS).map(([k, v]) => (
                <label key={k} className={`flex items-center gap-2 px-4 py-2.5 rounded border cursor-pointer transition-colors ${deliveryMethod === k ? DELIVERY_COLORS[k] + " border-current" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <input type="radio" name="deliveryMethod" value={k} checked={deliveryMethod === k} onChange={() => setDeliveryMethod(k)} className="sr-only" />
                  <span className="text-sm font-medium">{v}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ürünler */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Ürünler *</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-0.5">
                    <ProductInput item={item} idx={idx} products={products} onChange={changeItem} />
                    <button type="button" onClick={() => { setNewProductIdx(idx); setNewProd({ name: item.name, price: String(item.price || ""), costPrice: "", categoryId: "", brandId: "" }); }}
                      className="text-[10px] text-green-600 hover:text-green-800">
                      + Listede yoksa yeni ürün ekle
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-gray-400">Adet</label>
                    <input type="number" min="1" value={item.qty}
                      onChange={(e) => changeItem(idx, "qty", Number(e.target.value))}
                      className="w-14 border border-gray-200 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-gray-400">Fiyat (₺)</label>
                    <input type="number" min="0" value={item.price}
                      onChange={(e) => changeItem(idx, "price", Number(e.target.value))}
                      className="w-24 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-gray-400 invisible">Del</label>
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 border border-red-100 rounded hover:bg-red-50">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2">
              <button type="button" onClick={() => setItems((p) => [...p, { productId: null, name: "", qty: 1, price: 0 }])}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                + Ürün Satırı Ekle
              </button>
            </div>
            {/* Inline new product form (per-row) */}
            {newProductIdx !== null && (
              <div className="border border-green-200 rounded p-3 bg-green-50 space-y-2 mt-2">
                <p className="text-xs font-medium text-green-700">Yeni Ürün Ekle</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={newProd.name} onChange={(e) => setNewProd((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ürün adı *" autoFocus
                    className="col-span-2 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-green-400" />
                  <input type="number" value={newProd.price} onChange={(e) => setNewProd((p) => ({ ...p, price: e.target.value }))}
                    placeholder="Satış fiyatı ₺ *"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-green-400" />
                  <input type="number" value={newProd.costPrice} onChange={(e) => setNewProd((p) => ({ ...p, costPrice: e.target.value }))}
                    placeholder="Alış fiyatı ₺ (maliyet)"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-green-400" />
                  <select value={newProd.categoryId} onChange={(e) => setNewProd((p) => ({ ...p, categoryId: e.target.value }))}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-green-400">
                    <option value="">Kategori seç</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={newProd.brandId} onChange={(e) => setNewProd((p) => ({ ...p, brandId: e.target.value }))}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-green-400">
                    <option value="">Marka seç</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => saveNewProduct(newProductIdx)} disabled={!newProd.name.trim() || !newProd.price || prodSaving}
                    className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded disabled:opacity-60">
                    {prodSaving ? "Kaydediliyor..." : "Ürünü Kaydet ve Seç"}
                  </button>
                  <button type="button" onClick={() => setNewProductIdx(null)} className="text-xs text-gray-400 px-2">İptal</button>
                </div>
              </div>
            )}
          </div>

          {/* Tutar + İskonto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs font-medium text-gray-600">Toplam Tutar</label>
                <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={useManualTotal} onChange={(e) => setUseManualTotal(e.target.checked)} />
                  Manuel gir
                </label>
              </div>
              {useManualTotal
                ? <input type="number" min="0" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)}
                    placeholder="Tutar"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                : <div className="text-lg font-bold text-gray-800 py-1">{autoTotal.toLocaleString("tr-TR")} ₺</div>
              }
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">İskonto (₺)</label>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>

          {discountAmt > 0 && (
            <div className="bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">
              <span className="text-gray-600">Brüt: {grossTotal.toLocaleString("tr-TR")}₺</span>
              <span className="mx-2 text-gray-400">−</span>
              <span className="text-orange-600">İskonto: {discountAmt.toLocaleString("tr-TR")}₺</span>
              <span className="mx-2 text-gray-400">=</span>
              <span className="font-bold text-green-700">Net: {netTotal.toLocaleString("tr-TR")}₺</span>
            </div>
          )}

          {/* Not */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Not (opsiyonel)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Sipariş notu..."
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={pending}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {pending ? "Kaydediliyor..." : `Siparişi Oluştur${netTotal > 0 ? ` — ${netTotal.toLocaleString("tr-TR")}₺` : ""}`}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">
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
  orders, customers, products, categories, brands,
}: {
  orders: OrderRow[];
  customers: Customer[];
  products: ProductOption[];
  categories: CatBrand[];
  brands: CatBrand[];
}) {
  const [filter, setFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [editOrder, setEditOrder] = useState<OrderRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startBulkT] = useTransition();
  const router = useRouter();

  const filtered = orders.filter((o) => {
    const q = filter.toLowerCase();
    const matchQ = !q || o.orderNo.toLowerCase().includes(q)
      || (o.recipientName ?? "").toLowerCase().includes(q)
      || (o.recipientPhone ?? "").includes(q);
    return matchQ && (!sourceFilter || o.source === sourceFilter);
  });

  function toggleSelect(id: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }
  function toggleAll() {
    setSelected((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((o) => o.id)));
  }
  function handleBulkDelete() {
    if (!confirm(`${selected.size} siparişi silmek istediğinize emin misiniz?`)) return;
    startBulkT(async () => {
      for (const order of orders.filter((o) => selected.has(o.id))) {
        await deleteOrderById(order.id, order.source);
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-800">Siparişler</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{filtered.length} sipariş</span>
          {selected.size > 0 && (
            <button onClick={handleBulkDelete}
              className="bg-red-600 text-white text-xs px-4 py-2 rounded font-medium hover:bg-red-700 transition-colors">
              {selected.size} Siparişi Sil
            </button>
          )}
          <button onClick={() => setShowNewOrder(true)}
            className="bg-indigo-600 text-white text-xs px-4 py-2 rounded font-medium hover:bg-indigo-700 transition-colors">
            + Yeni Sipariş
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input value={filter} onChange={(e) => setFilter(e.target.value)}
          placeholder="Sipariş no, isim veya telefon..."
          className="border border-gray-200 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:border-indigo-400" />
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
              <th className="px-3 py-3 w-8">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" />
              </th>
              <th className="px-4 py-3">Sipariş</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Ürünler</th>
              <th className="px-4 py-3">Tutar</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Ödeme</th>
              <th className="px-4 py-3">Teslimat</th>
              <th className="px-4 py-3">Kargo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400 text-sm">Sipariş bulunamadı.</td></tr>
            )}
            {filtered.map((order) => (
              <tr key={order.id} className={`border-b border-gray-50 align-top ${selected.has(order.id) ? "bg-red-50" : "hover:bg-gray-50/60"}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} className="rounded" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-mono text-xs font-semibold text-gray-700">#{order.orderNo}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "2-digit" })}
                  </div>
                  <span className={`inline-block mt-1 text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded font-medium ${order.source === "web" ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                    {order.source === "web" ? "Web" : "Manuel"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-medium text-gray-700">{order.recipientName}</div>
                  {order.recipientPhone && <div className="text-[10px] text-gray-400">{order.recipientPhone}</div>}
                  {order.city && <div className="text-[10px] text-gray-400">{[order.district, order.city].filter(Boolean).join(", ")}</div>}
                  {order.note && <div className="text-[10px] text-orange-500 mt-0.5 max-w-[140px]" title={order.note}>Not: {order.note}</div>}
                </td>
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
                <td className="px-4 py-3">
                  {order.source === "web" ? (
                    <div>
                      <div className="font-bold text-gray-800 text-sm whitespace-nowrap">{order.total.toLocaleString("tr-TR")} ₺</div>
                      <div className="mt-1"><DiscountEditor order={order} /></div>
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
                <td className="px-4 py-3"><StatusEditor order={order} /></td>
                <td className="px-4 py-3"><PaymentEditor order={order} /></td>
                <td className="px-4 py-3"><DeliveryEditor order={order} /></td>
                <td className="px-4 py-3"><TrackingForm order={order} /></td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button onClick={() => setEditOrder(order)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 mr-3">Düzenle</button>
                  <DeleteButton order={order} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNewOrder && (
        <NewOrderModal customers={customers} products={products} categories={categories} brands={brands} onClose={() => setShowNewOrder(false)} />
      )}
      {editOrder && (
        <EditOrderModal
          order={editOrder}
          customers={customers}
          products={products}
          onClose={() => setEditOrder(null)}
        />
      )}
    </div>
  );
}

// ---- Delete Button ----
function DeleteButton({ order }: { order: OrderRow }) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  function handleDelete() {
    if (!confirm(`#${order.orderNo} siparişi silinsin mi? Finans kayıtları ve stok da geri alınır.`)) return;
    startTransition(async () => {
      try { await deleteOrderById(order.id, order.source); router.refresh(); }
      catch (e) { alert("Silme hatası: " + (e instanceof Error ? e.message : "Bilinmeyen hata")); }
    });
  }
  return (
    <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600">Sil</button>
  );
}

// ---- Edit Order Modal ----
function EditOrderModal({ order, customers: initCustomers, products: initProducts, onClose }: {
  order: OrderRow;
  customers: Customer[];
  products: ProductOption[];
  onClose: () => void;
}) {
  const router = useRouter();

  // State — pre-filled from existing order
  const [customers, setCustomers] = useState(initCustomers);
  const [products, setProducts] = useState(initProducts);
  const [customerId, setCustomerId] = useState(() => {
    // For manuel orders, find customer id by matching recipientName
    const match = initCustomers.find((c) => c.name === order.recipientName);
    return match?.id ?? "";
  });
  const [items, setItems] = useState<ItemForm[]>(
    order.items.map((i) => ({ productId: (i as { productId?: string }).productId ?? null, name: i.name, qty: i.qty, price: i.price }))
  );
  const [status, setStatus] = useState(order.status);
  const [deliveryMethod, setDeliveryMethod] = useState(order.deliveryMethod);
  const [discount, setDiscount] = useState(String(order.discount || ""));
  const [note, setNote] = useState(order.note ?? "");
  const [useManualTotal, setUseManualTotal] = useState(false);
  const [manualTotal, setManualTotal] = useState(String(order.total));
  const [pending, startSave] = useTransition();
  const [error, setError] = useState("");

  // Inline new customer
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "" });
  const [custSaving, startCustT] = useTransition();

  function changeItem(idx: number, field: keyof ItemForm, val: string | number | null) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }

  function saveNewCustomer() {
    if (!newCust.name.trim()) return;
    startCustT(async () => {
      const result = await createCustomer({ name: newCust.name.trim(), phone: newCust.phone.trim() || undefined });
      const newCustomer: Customer = { id: result.id, name: newCust.name.trim(), phone: newCust.phone.trim() || null };
      setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      setCustomerId(result.id);
      setNewCust({ name: "", phone: "" });
      setShowNewCustomer(false);
    });
  }

  const autoTotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const grossTotal = useManualTotal ? (Number(manualTotal) || 0) : autoTotal;
  const discountAmt = Number(discount) || 0;
  const netTotal = Math.max(0, grossTotal - discountAmt);

  function handleSave() {
    setError("");
    if (order.source === "manuel" && !customerId) { setError("Müşteri seçin."); return; }
    if (items.some((i) => !i.name.trim())) { setError("Tüm ürün isimlerini doldurun."); return; }

    startSave(async () => {
      try {
        await updateOrderItems(
          order.id, order.source,
          items.map((i) => ({ productId: i.productId ?? undefined, name: i.name, qty: i.qty, price: i.price })),
          order.source === "web" ? grossTotal : netTotal, // web: gross, manuel: net (no discount)
          note.trim() || null,
          { customerId: order.source === "manuel" ? customerId : undefined, discount: discountAmt, status, deliveryMethod }
        );
        router.refresh();
        onClose();
      } catch (e) {
        setError("Bir hata oluştu: " + (e instanceof Error ? e.message : "Bilinmeyen hata"));
      }
    });
  }

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-800">Sipariş Düzenle — #{order.orderNo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Müşteri */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Müşteri {order.source === "web" && <span className="text-gray-400">(web siparişi)</span>}
              </label>
              {order.source === "web" ? (
                <div className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 bg-gray-50">
                  {order.recipientName}
                  {order.recipientPhone && <span className="text-gray-400 ml-2">{order.recipientPhone}</span>}
                  {selectedCustomer && (
                    <a href={`/admin/musteriler/${selectedCustomer.id}`} target="_blank" rel="noreferrer"
                      className="ml-2 text-xs text-indigo-500 hover:text-indigo-700">Profil →</a>
                  )}
                </div>
              ) : showNewCustomer ? (
                <div className="border border-indigo-200 rounded p-3 bg-indigo-50 space-y-2">
                  <p className="text-xs font-medium text-indigo-700">Yeni Müşteri</p>
                  <input value={newCust.name} onChange={(e) => setNewCust((p) => ({ ...p, name: e.target.value }))}
                    placeholder="İsim *" autoFocus className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400" />
                  <input value={newCust.phone} onChange={(e) => setNewCust((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Telefon (opsiyonel)" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400" />
                  <div className="flex gap-2">
                    <button type="button" onClick={saveNewCustomer} disabled={!newCust.name.trim() || custSaving}
                      className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded disabled:opacity-60">
                      {custSaving ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                    <button type="button" onClick={() => setShowNewCustomer(false)} className="text-xs text-gray-400 px-2">İptal</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    <option value="">Müşteri seçin...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    {customerId && (
                      <a href={`/admin/musteriler/${customerId}`} target="_blank" rel="noreferrer"
                        className="text-xs text-indigo-500 hover:text-indigo-700">Profil →</a>
                    )}
                    <button type="button" onClick={() => setShowNewCustomer(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      + Yeni müşteri ekle
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Durum */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sipariş Durumu</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Teslimat */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Teslimat Yöntemi</label>
            <div className="flex gap-3">
              {Object.entries(DELIVERY_LABELS).map(([k, v]) => (
                <label key={k} className={`flex items-center gap-2 px-4 py-2.5 rounded border cursor-pointer transition-colors ${deliveryMethod === k ? DELIVERY_COLORS[k] + " border-current" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <input type="radio" name="edit_deliveryMethod" value={k} checked={deliveryMethod === k} onChange={() => setDeliveryMethod(k)} className="sr-only" />
                  <span className="text-sm font-medium">{v}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ürünler */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Ürünler *</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <ProductInput item={item} idx={idx} products={products} onChange={changeItem} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-gray-400">Adet</label>
                    <input type="number" min="1" value={item.qty} onChange={(e) => changeItem(idx, "qty", Number(e.target.value))}
                      className="w-14 border border-gray-200 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-gray-400">Fiyat (₺)</label>
                    <input type="number" min="0" value={item.price} onChange={(e) => changeItem(idx, "price", Number(e.target.value))}
                      className="w-24 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-gray-400 invisible">Del</label>
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 border border-red-100 rounded hover:bg-red-50">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setItems((p) => [...p, { productId: null, name: "", qty: 1, price: 0 }])}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-2">+ Ürün Satırı Ekle</button>
          </div>

          {/* Tutar + İskonto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs font-medium text-gray-600">Toplam Tutar</label>
                <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={useManualTotal} onChange={(e) => setUseManualTotal(e.target.checked)} />
                  Manuel gir
                </label>
              </div>
              {useManualTotal
                ? <input type="number" min="0" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                : <div className="text-lg font-bold text-gray-800 py-1">{autoTotal.toLocaleString("tr-TR")} ₺</div>
              }
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">İskonto (₺)</label>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>

          {discountAmt > 0 && (
            <div className="bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">
              <span className="text-gray-600">Brüt: {grossTotal.toLocaleString("tr-TR")}₺</span>
              <span className="mx-2 text-gray-400">−</span>
              <span className="text-orange-600">İskonto: {discountAmt.toLocaleString("tr-TR")}₺</span>
              <span className="mx-2 text-gray-400">=</span>
              <span className="font-bold text-green-700">Net: {netTotal.toLocaleString("tr-TR")}₺</span>
            </div>
          )}

          {/* Not */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Not (opsiyonel)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Sipariş notu..."
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleSave} disabled={pending}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {pending ? "Kaydediliyor..." : `Kaydet${netTotal > 0 ? ` — ${netTotal.toLocaleString("tr-TR")}₺` : ""}`}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
