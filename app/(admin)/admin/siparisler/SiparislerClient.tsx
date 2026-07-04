"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import { normalizeOrderItems } from "@/lib/order-items";
import { fmtOrderNo }          from "@/lib/order-no";
import {
  updateSiteOrderStatus, updateManuelOrderStatus, updateTrackingNo, updatePaymentStatus,
  updateDeliveryMethod, updateSiteOrderDiscount,
  updateManuelOrderPayment, updateManuelOrderTotal, updateManuelOrderDelivery,
  updateOrderItems, deleteOrderById, updateManuelOrderTracking, updateManuelOrderPaymentStatus,
} from "@/lib/actions/site-order-admin";
import { createOrder } from "@/lib/actions/order";
import { createCustomer } from "@/lib/actions/customer";
import { createProduct } from "@/lib/actions/product";
import { createCustomerDebt, addCustomerPayment } from "@/lib/actions/debt";
import { addManualOrderToDepo, createDepoSiparisFromOrder } from "@/lib/actions/depo-siparis";

const CARGO_TRACKING_URLS: Record<string, (no: string) => string> = {
  "Yurtiçi Kargo": (no) => `https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=${no}`,
  "MNG Kargo":     (no) => `https://www.mngkargo.com.tr/sorgulama.aspx?id=${no}`,
  "Aras Kargo":    (no) => `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${no}`,
  "PTT Kargo":     ()   => `https://www.ptt.gov.tr/tr/ptt-kargo-kargo-sorgulama`,
  "Sürat Kargo":   (no) => `https://suratkargo.com.tr/KargoSorgulama/${no}`,
  "DHL":           (no) => `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${no}`,
  "UPS":           (no) => `https://www.ups.com/track?tracknum=${no}`,
};

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
  PARTIAL: "Kısmi Ödeme",
  PAID:    "Ödeme Alındı",
  FREE:    "Ücretsiz",
};
const PAYMENT_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PARTIAL: "bg-orange-50 text-orange-700 border-orange-200",
  PAID:    "bg-green-50 text-green-700 border-green-200",
  FREE:    "bg-purple-50 text-purple-700 border-purple-200",
};
const DELIVERY_LABELS: Record<string, string> = { CARGO: "Kargo", PICKUP: "Mağaza Teslim" };
const DELIVERY_COLORS: Record<string, string> = {
  CARGO:  "bg-blue-50 text-blue-700 border-blue-200",
  PICKUP: "bg-teal-50 text-teal-700 border-teal-200",
  STORE:  "bg-teal-50 text-teal-700 border-teal-200",
};

function CopyButton({ text, label = "Kopyala" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className={`shrink-0 text-[10px] px-2.5 py-1.5 rounded font-medium transition-colors ${copied ? "bg-green-100 text-green-700" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}
    >
      {copied ? "✓ Kopyalandı" : label}
    </button>
  );
}

function safeOrderItems(items: unknown) {
  return normalizeOrderItems(items).map((item) => ({
    ...item,
    name: item.name || "Ürün",
    qty: Number(item.qty) || 1,
    price: Number(item.price) || 0,
  }));
}

interface OrderRow {
  id: string; customerId: string | null; source: "web" | "manuel"; orderNo: string; status: string;
  paymentStatus: string; paymentMethod: string; deliveryMethod: string; createdAt: string;
  recipientName: string | null; recipientPhone: string | null;
  addressLine: string | null; city: string | null; district: string | null;
  items: unknown;
  total: number; discount: number; note: string | null;
  trackingNo: string | null; cargoCompany: string | null;
  memberName: string | null; memberPhone: string | null;
}
interface Customer { id: string; name: string; phone: string | null; segment?: string | null }
interface ProductOption { id: string; name: string; price: number; stock: number; costPrice?: number | null }
interface CatBrand { id: string; name: string }
interface OrderDebt { id: string; totalAmount: number; paidAmount: number; description: string }

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
  const router = useRouter();

  useEffect(() => { setCur(order.status); }, [order.status]);

  return (
    <PortalDropdown
      label={STATUS_LABELS[cur] ?? cur}
      colorCls={STATUS_COLORS[cur] ?? "bg-gray-100 text-gray-600 border-gray-200"}
      disabled={pending}
      current={cur}
      options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ key: k, label: v }))}
      onSelect={(key) => {
        setCur(key);
        startTransition(async () => {
          if (order.source === "web") await updateSiteOrderStatus(order.id, key);
          else await updateManuelOrderStatus(order.id, key);
          router.refresh();
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
    : Object.entries(PAYMENT_LABELS).map(([k, v]) => ({ key: k, label: v }));

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
  useEffect(() => { setCur(order.deliveryMethod); }, [order.deliveryMethod]);

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
  const router = useRouter();

  const isPickup = order.deliveryMethod === "PICKUP" || order.deliveryMethod === "STORE";

  function handleSave() {
    startTransition(async () => {
      if (order.source === "web") {
        await updateTrackingNo(order.id, trackingNo, company);
      } else {
        await updateManuelOrderTracking(order.id, trackingNo, company);
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); router.refresh(); }, 1000);
    });
  }

  if (isPickup) {
    return <span className="text-xs text-gray-300 cursor-not-allowed">— Mağaza Teslim</span>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap text-left">
        {order.trackingNo || order.cargoCompany
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

const DIAMOND_MARKUP = 500;

function ProductInput({
  item, idx, products, onChange, isDiamond,
}: {
  item: ItemForm;
  idx: number;
  products: ProductOption[];
  onChange: (idx: number, field: keyof ItemForm, val: string | number | null) => void;
  isDiamond?: boolean;
}) {
  const [query, setQuery] = useState(item.name);
  const [showSug, setShowSug] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = query.trim().length > 0
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  function select(p: ProductOption) {
    const price = isDiamond && p.costPrice != null && p.costPrice > 0
      ? Math.round(p.costPrice + DIAMOND_MARKUP)
      : p.price;
    setQuery(p.name);
    setShowSug(false);
    onChange(idx, "name", p.name);
    onChange(idx, "productId", p.id);
    onChange(idx, "price", price);
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
          {suggestions.map((p) => {
            const displayPrice = isDiamond && p.costPrice != null && p.costPrice > 0
              ? Math.round(p.costPrice + DIAMOND_MARKUP)
              : p.price;
            return (
              <button key={p.id} type="button" onMouseDown={() => select(p)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between">
                <span className="font-medium text-gray-800">{p.name}</span>
                <span className="text-gray-500 ml-2 whitespace-nowrap flex items-center gap-1">
                  {isDiamond && p.costPrice != null && p.costPrice > 0 ? (
                    <span className="text-cyan-700 font-semibold">{displayPrice.toLocaleString("tr-TR")}₺</span>
                  ) : (
                    <span>{displayPrice.toLocaleString("tr-TR")}₺</span>
                  )}
                  {" · "}
                  <span className={p.stock <= 0 ? "text-red-500" : "text-green-600"}>
                    Stok: {p.stock}
                  </span>
                </span>
              </button>
            );
          })}
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
  const [freeShipping, setFreeShipping] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const selectedCustomer = customers.find(c => c.id === customerId);
  const isDiamond = selectedCustomer?.segment === "DIAMOND";

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
      try {
        const result = await createCustomer({ name: newCust.name.trim(), phone: newCust.phone.trim() || undefined });
        if (result?.error) { setError("Müşteri eklenemedi: " + result.error); return; }
        if (!result?.id) { setError("Müşteri eklenemedi: ID alınamadı."); return; }
        const newCustomer: Customer = { id: result.id, name: newCust.name.trim(), phone: newCust.phone.trim() || null };
        setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
        setCustomerId(result.id);
        setNewCust({ name: "", phone: "" });
        setShowNewCustomer(false);
      } catch (e) {
        setError("Müşteri eklenemedi: " + (e instanceof Error ? e.message : "Bilinmeyen hata"));
      }
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
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const shippingFee = (!freeShipping && isDiamond && deliveryMethod === "CARGO") ? Math.ceil(totalQty / 5) * 200 : 0;
  const netTotal = Math.max(0, grossTotal - discountAmt) + shippingFee;

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
        shippingFee: shippingFee > 0 ? shippingFee : null,
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
                      <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}{c.segment === "DIAMOND" ? " ◆ Diamond" : ""}</option>
                    ))}
                  </select>
                  {isDiamond && (
                    <div className="flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 rounded px-3 py-1.5 text-xs text-cyan-800 font-medium">
                      ◆ Diamond Üye — Alış fiyatı +{DIAMOND_MARKUP}₺ uygulanıyor
                    </div>
                  )}
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
                  {isDiamond && k === "CARGO" && (
                    <span className="text-[10px] text-blue-600 font-normal">+kargo ücreti</span>
                  )}
                </label>
              ))}
            </div>
            {isDiamond && deliveryMethod === "CARGO" && (
              <div className="mt-1.5 flex items-center gap-3">
                <p className={`text-[11px] ${freeShipping ? "line-through text-gray-400" : "text-blue-600"}`}>
                  {totalQty} ürün → Kargo: {Math.ceil(totalQty / 5) * 200}₺ (her 5 ürün için 200₺)
                </p>
                <label className="flex items-center gap-1 cursor-pointer text-[11px] text-green-700 font-medium">
                  <input type="checkbox" checked={freeShipping} onChange={(e) => setFreeShipping(e.target.checked)} className="w-3 h-3" />
                  Ücretsiz Kargo
                </label>
              </div>
            )}
          </div>

          {/* Ürünler */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Ürünler *</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-0.5">
                    <ProductInput item={item} idx={idx} products={products} onChange={changeItem} isDiamond={isDiamond} />
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
                    <label className="text-[10px] text-gray-400">Toplam</label>
                    <div className="w-24 px-2 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded text-right">
                      {(item.qty * item.price).toLocaleString("tr-TR")} ₺
                    </div>
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

          {(discountAmt > 0 || shippingFee > 0) && (
            <div className="bg-green-50 border border-green-200 rounded px-3 py-2 text-sm space-y-0.5">
              <div>
                <span className="text-gray-600">Ürünler: {grossTotal.toLocaleString("tr-TR")}₺</span>
                {discountAmt > 0 && <>
                  <span className="mx-2 text-gray-400">−</span>
                  <span className="text-orange-600">İskonto: {discountAmt.toLocaleString("tr-TR")}₺</span>
                </>}
                {shippingFee > 0 && <>
                  <span className="mx-2 text-gray-400">+</span>
                  <span className="text-blue-600">Kargo: {shippingFee.toLocaleString("tr-TR")}₺</span>
                </>}
                <span className="mx-2 text-gray-400">=</span>
                <span className="font-bold text-green-700">Net: {netTotal.toLocaleString("tr-TR")}₺</span>
              </div>
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
  orders, customers, products, categories, brands, debtByOrderId, initialFilter,
}: {
  orders: OrderRow[];
  customers: Customer[];
  products: ProductOption[];
  categories: CatBrand[];
  brands: CatBrand[];
  debtByOrderId: Record<string, OrderDebt>;
  initialFilter?: string;
}) {
  const [filter, setFilter] = useState(initialFilter ?? "");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [editOrder, setEditOrder] = useState<OrderRow | null>(null);
  const [summaryOrder, setSummaryOrder] = useState<OrderRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startBulkT] = useTransition();
  const router = useRouter();

  const filtered = orders.filter((o) => {
    const q = filter.toLowerCase();
    const matchQ = !q || o.orderNo.toLowerCase().includes(q)
      || (o.recipientName ?? "").toLowerCase().includes(q)
      || (o.recipientPhone ?? "").includes(q);
    const matchSource = !sourceFilter || o.source === sourceFilter;
    const matchStatus = statusFilter === "ALL"
      ? true
      : statusFilter === "FREE"
      ? o.paymentStatus === "FREE"
      : o.status === statusFilter;
    return matchQ && matchSource && matchStatus;
  });

  const statusCounts = {
    PENDING:   orders.filter((o) => o.status === "PENDING").length,
    SHIPPED:   orders.filter((o) => o.status === "SHIPPED").length,
    DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
    FREE:      orders.filter((o) => o.paymentStatus === "FREE").length,
    ALL:       orders.length,
  };

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

      {/* ── Status Tabs ── */}
      <div className="flex gap-0 border-b border-gray-200 mb-5 overflow-x-auto">
        {([
          { key: "PENDING",   label: "Yeni",             color: "text-yellow-700 border-yellow-500" },
          { key: "SHIPPED",   label: "Kargoya Verildi",  color: "text-indigo-700 border-indigo-500" },
          { key: "DELIVERED", label: "Teslim Edildi",    color: "text-green-700 border-green-500" },
          { key: "CANCELLED", label: "İptal Edildi",     color: "text-red-600 border-red-400" },
          { key: "FREE",      label: "Ücretsiz",         color: "text-purple-700 border-purple-500" },
          { key: "ALL",       label: "Tüm Siparişler",   color: "text-gray-600 border-gray-500" },
        ] as const).map(({ key, label, color }) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              statusFilter === key
                ? `${color} bg-gray-50`
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {label}
            <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
              statusFilter === key ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-400"
            }`}>
              {statusCounts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Arama + Kaynak Filtresi ── */}
      <div className="flex gap-3 mb-4 flex-wrap">
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
              <th className="px-3 py-3">Sipariş</th>
              <th className="px-4 py-3 min-w-[160px]">Müşteri</th>
              <th className="px-4 py-3">Ürünler</th>
              <th className="px-3 py-3">Tutar</th>
              <th className="px-3 py-3">İndirim</th>
              <th className="px-3 py-3 bg-green-50">İndirimli Tutar</th>
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
                <td className="px-3 py-3 whitespace-nowrap">
                  <button onClick={() => setSummaryOrder(order)} className="font-mono text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline text-left">#{fmtOrderNo(order.orderNo)}</button>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "2-digit" })}
                  </div>
                  <span className={`inline-block mt-1 text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded font-medium ${order.source === "web" ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                    {order.source === "web" ? "Web" : "M"}
                  </span>
                </td>
                <td className="px-4 py-3 min-w-[160px]">
                  {order.customerId
                    ? <Link href={`/admin/musteriler/${order.customerId}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline">{order.recipientName}</Link>
                    : <div className="text-sm font-medium text-gray-700">{order.recipientName}</div>
                  }
                  {order.city && <div className="text-[10px] text-gray-400">{[order.district, order.city].filter(Boolean).join(", ")}</div>}
                  {order.note && <div className="text-[10px] text-orange-500 mt-0.5 max-w-[160px]" title={order.note}>Not: {order.note}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    {safeOrderItems(order.items).map((item, i) => (
                      <div key={i} className="text-xs text-gray-600">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-400 ml-1">×{item.qty}</span>
                        <span className="text-gray-500 ml-1">{(item.price * item.qty).toLocaleString("tr-TR")}₺</span>
                      </div>
                    ))}
                  </div>
                </td>
                {/* Tutar: ürünlerin orijinal fiyat toplamı */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium text-gray-800 text-sm">
                    {safeOrderItems(order.items).reduce((s, i) => s + i.qty * i.price, 0).toLocaleString("tr-TR")} ₺
                  </div>
                </td>
                {/* İndirim: otomatik hesaplanır (Tutar - İndirimli Tutar) */}
                {(() => {
                  const originalTotal = safeOrderItems(order.items).reduce((s, i) => s + i.qty * i.price, 0);
                  const indirimliTutar = order.source === "web" ? order.total - order.discount : order.total;
                  const indirim = originalTotal - indirimliTutar;
                  return (
                    <>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {indirim > 0
                          ? <span className="text-xs text-orange-600 font-medium">-{indirim.toLocaleString("tr-TR")} ₺</span>
                          : <span className="text-xs text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap bg-green-50">
                        {order.source === "web" ? (
                          <div className="font-bold text-green-800 text-sm">
                            {indirimliTutar.toLocaleString("tr-TR")} ₺
                          </div>
                        ) : (
                          <TotalEditor order={order} />
                        )}
                      </td>
                    </>
                  );
                })()}
                <td className="px-4 py-3"><StatusEditor order={order} /></td>
                <td className="px-4 py-3"><PaymentEditor order={order} /></td>
                <td className="px-4 py-3"><DeliveryEditor order={order} /></td>
                <td className="px-4 py-3"><TrackingForm order={order} /></td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button onClick={() => setEditOrder(order)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 mr-3">Düzenle</button>
                  <SendToDepoButton order={order} />
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
          categories={categories}
          brands={brands}
          existingDebt={debtByOrderId[editOrder.id] ?? null}
          onClose={() => setEditOrder(null)}
        />
      )}
      {summaryOrder && (
        <OrderSummaryModal order={summaryOrder} debt={debtByOrderId[summaryOrder.id] ?? null} onClose={() => setSummaryOrder(null)} />
      )}
    </div>
  );
}

// ---- Order Summary Modal ----
function OrderSummaryModal({ order, debt, onClose }: { order: OrderRow; debt: OrderDebt | null; onClose: () => void }) {
  const items = safeOrderItems(order.items);
  const originalTotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const indirimliTutar = order.source === "web" ? order.total - order.discount : order.total;
  const indirim = originalTotal - indirimliTutar;

  const alinanPaid = debt
    ? debt.paidAmount
    : (order.paymentStatus === "PAID" || order.paymentStatus === "FREE" ? indirimliTutar : 0);
  const kalan = Math.max(0, indirimliTutar - alinanPaid);
  const showPaymentDetail = order.paymentStatus !== "FREE";

  const phone = order.recipientPhone || order.memberPhone || null;
  const cleanPhone = phone ? (() => { const d = phone.replace(/\D/g, ""); return d.startsWith("90") ? d : d.startsWith("0") ? "9" + d : "90" + d; })() : null;

  const lines: string[] = [
    `Sayın ${order.recipientName ?? "Müşteri"},`,
    ``,
    `#${fmtOrderNo(order.orderNo)} numaralı siparişinizin özeti:`,
    ``,
    ...items.map((i) => `• ${i.name} ×${i.qty} = ${(i.price * i.qty).toLocaleString("tr-TR")} ₺`),
    ``,
  ];
  if (indirim > 0) {
    lines.push(`Orijinal Tutar: ${originalTotal.toLocaleString("tr-TR")} ₺`);
    lines.push(`İndirim: -${indirim.toLocaleString("tr-TR")} ₺`);
  }
  lines.push(`Toplam: ${indirimliTutar.toLocaleString("tr-TR")} ₺`);
  if (showPaymentDetail) {
    lines.push(`Alınan: ${alinanPaid.toLocaleString("tr-TR")} ₺`);
    lines.push(`Kalan: ${kalan.toLocaleString("tr-TR")} ₺`);
  }
  lines.push(`Durum: ${STATUS_LABELS[order.status] ?? order.status}`);
  if (order.cargoCompany || order.trackingNo) {
    lines.push(`Kargo: ${[order.cargoCompany, order.trackingNo].filter(Boolean).join(" — ")}`);
    if (order.trackingNo && order.cargoCompany && CARGO_TRACKING_URLS[order.cargoCompany]) {
      lines.push(`Takip: ${CARGO_TRACKING_URLS[order.cargoCompany](order.trackingNo)}`);
    }
  }
  lines.push(``, `İyi günler dileriz, Ormivo`);

  const message = lines.join("\n");
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4A882]">Sipariş Özeti</p>
            <h2 className="font-mono text-lg font-bold text-gray-800">#{fmtOrderNo(order.orderNo)}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Müşteri + Kargo Bilgisi Kopyala */}
          {(() => {
            const adres = [order.addressLine, order.district, order.city].filter(Boolean).join(", ");
            const kargoMetni = [order.recipientName, phone, adres].filter(Boolean).join("\n");
            return (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] tracking-widest uppercase text-gray-400 mb-1.5">Alıcı / Kargo Bilgisi</p>
                    <p className="text-sm font-semibold text-gray-800">{order.recipientName}</p>
                    {phone && <p className="text-xs text-gray-600 mt-0.5 font-mono">{phone}</p>}
                    {adres && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{adres}</p>}
                  </div>
                  <CopyButton text={kargoMetni} label="Kopyala" />
                </div>
              </div>
            );
          })()}

          {/* Ürünler */}
          <div>
            <p className="text-[9px] tracking-widest uppercase text-gray-400 mb-2">Ürünler</p>
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name} <span className="text-gray-400">×{item.qty}</span></span>
                  <span className="text-gray-800 font-medium">{(item.price * item.qty).toLocaleString("tr-TR")} ₺</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
              {indirim > 0 && (
                <>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Orijinal Tutar</span>
                    <span>{originalTotal.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <div className="flex justify-between text-xs text-orange-600">
                    <span>İndirim</span>
                    <span>-{indirim.toLocaleString("tr-TR")} ₺</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm font-bold text-green-800">
                <span>Toplam</span>
                <span>{indirimliTutar.toLocaleString("tr-TR")} ₺</span>
              </div>
              {showPaymentDetail && (
                <>
                  <div className="flex justify-between text-xs text-blue-600 pt-1">
                    <span>Alınan</span>
                    <span>+{alinanPaid.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-red-600">
                    <span>Kalan</span>
                    <span>{kalan.toLocaleString("tr-TR")} ₺</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Durum */}
          <div className="flex gap-4">
            <div>
              <p className="text-[9px] tracking-widest uppercase text-gray-400 mb-1">Durum</p>
              <span className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border ${STATUS_COLORS[order.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
            <div>
              <p className="text-[9px] tracking-widest uppercase text-gray-400 mb-1">Ödeme</p>
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border ${PAYMENT_COLORS[order.paymentStatus] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
                </span>
                <span className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200">
                  {order.paymentMethod === "KART" ? "💳 Kart" : "🏦 Havale/EFT"}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[9px] tracking-widest uppercase text-gray-400 mb-1">Teslimat</p>
              <span className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border ${DELIVERY_COLORS[order.deliveryMethod] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                {DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
              </span>
            </div>
          </div>

          {/* Kargo */}
          {(order.cargoCompany || order.trackingNo) && (
            <div>
              <p className="text-[9px] tracking-widest uppercase text-gray-400 mb-1">Kargo</p>
              <p className="text-sm text-gray-700 mb-1">{[order.cargoCompany, order.trackingNo].filter(Boolean).join(" — ")}</p>
              {order.trackingNo && order.cargoCompany && CARGO_TRACKING_URLS[order.cargoCompany] && (
                <a
                  href={CARGO_TRACKING_URLS[order.cargoCompany](order.trackingNo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  Kargo Takibine Git →
                </a>
              )}
            </div>
          )}

          {/* Not */}
          {order.note && (
            <div>
              <p className="text-[9px] tracking-widest uppercase text-gray-400 mb-1">Not</p>
              <p className="text-sm text-gray-600 italic">{order.note}</p>
            </div>
          )}
        </div>

        {/* WhatsApp Button */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {!phone && (
            <p className="text-[10px] text-gray-400 mb-2">Müşteri telefon numarası kayıtlı değil — WhatsApp açılır, alıcıyı kendiniz seçebilirsiniz.</p>
          )}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-medium text-sm py-3 rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp ile Gönder{phone ? ` (${phone})` : ""}
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---- Send to Depo Button ----
function SendToDepoButton({ order }: { order: OrderRow }) {
  const [pending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [depoName, setDepoName] = useState("");
  const [depoPhone, setDepoPhone] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();

  function handleSend() {
    if (!confirm(`#${fmtOrderNo(order.orderNo)} siparişindeki ürünler depo siparişine eklensin mi?`)) return;
    startTransition(async () => {
      try {
        const res = await addManualOrderToDepo(order.id, order.source);
        if ("needsNewOrder" in res && res.needsNewOrder) {
          setShowModal(true);
          return;
        }
        if (!res.success) { alert((res as { error?: string }).error ?? "Aktarım başarısız."); return; }
        alert(res.mode === "updated" ? "Mevcut açık depo siparişine eklendi." : "Depo siparişine eklendi.");
        setSent(true);
        router.refresh();
      } catch (e) { alert("Hata: " + (e instanceof Error ? e.message : "Bilinmeyen hata")); }
    });
  }

  function handleCreate() {
    if (!depoName.trim()) { alert("Depo adı gerekli."); return; }
    startTransition(async () => {
      try {
        await createDepoSiparisFromOrder(order.id, order.source, depoName, depoPhone);
        setShowModal(false);
        alert("Yeni depo siparişi oluşturuldu.");
        router.refresh();
      } catch (e) { alert("Hata: " + (e instanceof Error ? e.message : "Bilinmeyen hata")); }
    });
  }

  return (
    <>
      <button onClick={handleSend} disabled={pending || sent || order.status === "SHIPPED" || order.status === "DELIVERED" || order.status === "CANCELLED"}
        title={sent ? "Bu sipariş zaten depoya eklendi" : order.status !== "PENDING" ? "Sadece beklemedeki siparişler depoya eklenebilir" : undefined}
        className="text-xs text-emerald-600 hover:text-emerald-800 mr-3 disabled:opacity-50 disabled:cursor-not-allowed">
        {sent ? "✓ Eklendi" : "Depoya Ekle"}
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[#2c1810]">Yeni Depo Siparişi Oluştur</h3>
            <p className="text-xs text-[#8b6f5e]">Açık bir depo siparişi bulunamadı. Yeni oluşturmak için depo bilgilerini girin.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#5c4033] block mb-1">Depo / Tedarikçi Adı *</label>
                <input value={depoName} onChange={(e) => setDepoName(e.target.value)} className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e]" placeholder="Depo adı" />
              </div>
              <div>
                <label className="text-xs text-[#5c4033] block mb-1">Telefon</label>
                <input value={depoPhone} onChange={(e) => setDepoPhone(e.target.value)} className="w-full border border-[#d4c5ba] px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e]" placeholder="05XX XXX XX XX" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810] px-4 py-2">İptal</button>
              <button onClick={handleCreate} disabled={pending} className="bg-[#2c1810] text-white text-xs px-5 py-2 hover:bg-[#3d2418] disabled:opacity-50">Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DeleteButton({ order }: { order: OrderRow }) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  function handleDelete() {
    if (!confirm(`#${fmtOrderNo(order.orderNo)} siparişi silinsin mi? Finans kayıtları ve stok da geri alınır.`)) return;
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
function EditOrderModal({ order, customers: initCustomers, products: initProducts, categories, brands, existingDebt, onClose }: {
  order: OrderRow;
  customers: Customer[];
  products: ProductOption[];
  categories: CatBrand[];
  brands: CatBrand[];
  existingDebt: OrderDebt | null;
  onClose: () => void;
}) {
  const router = useRouter();

  const [customers, setCustomers] = useState(initCustomers);
  const [products, setProducts] = useState(initProducts);
  const [customerId, setCustomerId] = useState(() => {
    const match = initCustomers.find((c) => c.name === order.recipientName);
    return match?.id ?? "";
  });
  const [items, setItems] = useState<ItemForm[]>(
    safeOrderItems(order.items).map((i) => ({ productId: (i as { productId?: string }).productId ?? null, name: i.name, qty: i.qty, price: i.price }))
  );
  const [status, setStatus]               = useState(order.status);
  const [deliveryMethod, setDeliveryMethod] = useState(order.deliveryMethod);
  const [discount, setDiscount]           = useState(String(order.discount || ""));
  // Mevcut borç kaydı varsa → ek ödeme modu; yoksa → yeni alınan tutar
  const [alinanTutar, setAlinanTutar]     = useState("");
  const [editTrackingNo, setEditTrackingNo]   = useState(order.trackingNo ?? "");
  const [editCargoCompany, setEditCargoCompany] = useState(order.cargoCompany ?? "");
  const [note, setNote]                   = useState(order.note ?? "");
  const [manualTotal, setManualTotal]     = useState(String(order.total));
  const [totalEdited, setTotalEdited]     = useState(() => {
    const initialAuto = safeOrderItems(order.items).reduce((s, i) => s + i.qty * i.price, 0);
    return Math.abs(Number(order.total) - initialAuto) > 0.01;
  });
  const [pending, startSave]              = useTransition();
  const [error, setError]                 = useState("");

  // Yeni müşteri
  const [showNewCust, setShowNewCust] = useState(false);
  const [newCust, setNewCust]         = useState({ name: "", phone: "" });
  const [custSaving, startCustT]      = useTransition();

  // Yeni ürün
  const [newProdIdx, setNewProdIdx]   = useState<number | null>(null);
  const [newProd, setNewProd]         = useState({ name: "", price: "", costPrice: "", categoryId: "", brandId: "" });
  const [prodSaving, startProdT]      = useTransition();

  function changeItem(idx: number, field: keyof ItemForm, val: string | number | null) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }

  // Ürünler değişince toplam otomatik güncelle (kullanıcı manuel değiştirmediyse)
  const autoTotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  useEffect(() => {
    if (!totalEdited) setManualTotal(String(autoTotal));
  }, [autoTotal, totalEdited]);

  const grossTotal  = Number(manualTotal) || 0;
  const discountAmt = Number(discount) || 0;
  const netTotal    = Math.max(0, grossTotal - discountAmt);

  function saveNewCustomer() {
    if (!newCust.name.trim()) return;
    startCustT(async () => {
      try {
        const result = await createCustomer({ name: newCust.name.trim(), phone: newCust.phone.trim() || undefined });
        if (result?.error) { setError("Müşteri eklenemedi: " + result.error); return; }
        if (!result?.id) { setError("Müşteri eklenemedi: ID alınamadı."); return; }
        const c: Customer = { id: result.id, name: newCust.name.trim(), phone: newCust.phone.trim() || null };
        setCustomers((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
        setCustomerId(result.id);
        setNewCust({ name: "", phone: "" });
        setShowNewCust(false);
      } catch (e) {
        setError("Müşteri eklenemedi: " + (e instanceof Error ? e.message : "Bilinmeyen hata"));
      }
    });
  }

  function saveNewProduct(idx: number) {
    if (!newProd.name.trim() || !newProd.price) return;
    startProdT(async () => {
      const slug = newProd.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      await createProduct({
        name: newProd.name.trim(), slug: `${slug}-${Date.now()}`, description: "",
        price: Number(newProd.price), costPrice: newProd.costPrice ? Number(newProd.costPrice) : undefined,
        categoryId: newProd.categoryId || undefined, brandId: newProd.brandId || undefined,
        stock: 0, isActive: true, images: [],
      });
      const p: ProductOption = { id: `temp-${Date.now()}`, name: newProd.name.trim(), price: Number(newProd.price), stock: 0 };
      setProducts((prev) => [...prev, p]);
      changeItem(idx, "name", p.name);
      changeItem(idx, "price", p.price);
      setNewProd({ name: "", price: "", costPrice: "", categoryId: "", brandId: "" });
      setNewProdIdx(null);
    });
  }

  function handleSave() {
    setError("");
    if (order.source === "manuel" && !customerId) { setError("Müşteri seçin."); return; }
    if (items.some((i) => !i.name.trim())) { setError("Tüm ürün isimlerini doldurun."); return; }
    startSave(async () => {
      try {
        await updateOrderItems(
          order.id, order.source,
          items.map((i) => ({ productId: i.productId ?? undefined, name: i.name, qty: i.qty, price: i.price })),
          order.source === "web" ? grossTotal : netTotal,
          note.trim() || null,
          { customerId: order.source === "manuel" ? customerId : undefined, discount: discountAmt, status, deliveryMethod }
        );
        // Kargo bilgisi güncelle
        if (editTrackingNo.trim() || editCargoCompany.trim()) {
          if (order.source === "web") {
            await updateTrackingNo(order.id, editTrackingNo, editCargoCompany);
          } else {
            await updateManuelOrderTracking(order.id, editTrackingNo, editCargoCompany);
          }
        }
        // Alınan tutar / ek ödeme işlemi
        const alinanAmt = alinanTutar.trim() ? Number(alinanTutar) : null;
        if (alinanAmt !== null && alinanAmt > 0) {
          if (existingDebt) {
            // Mevcut borç kaydına ek ödeme ekle
            await addCustomerPayment({ debtId: existingDebt.id, amount: alinanAmt, note: "Sipariş düzenlemesinden ek ödeme" });
          } else if (customerId) {
            if (alinanAmt < netTotal) {
              // Kısmi ödeme → borç kaydı oluştur
              await createCustomerDebt({
                customerId,
                orderId: order.source === "manuel" ? order.id : undefined,
                description: `Sipariş #${order.orderNo} — kalan borç`,
                totalAmount: netTotal,
                initialPayment: alinanAmt,
              });
            } else {
              // Tam ödeme → sadece paymentStatus güncelle
              if (order.source === "web") {
                await updatePaymentStatus(order.id, "PAID");
              } else {
                await updateManuelOrderPaymentStatus(order.id, "PAID");
              }
            }
          }
        }
        router.refresh();
        onClose();
      } catch (e) {
        setError("Bir hata oluştu: " + (e instanceof Error ? e.message : "Bilinmeyen hata"));
      }
    });
  }

  const selectedCust = customers.find((c) => c.id === customerId);

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8ddd6] sticky top-0 bg-white z-10">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#8b6f5e]">Sipariş Düzenle</p>
            <h2 className="text-lg font-light text-[#2c1810] tracking-wide mt-0.5">#{fmtOrderNo(order.orderNo)}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#8b6f5e] hover:text-[#2c1810] hover:bg-[#f5f0eb] rounded-sm transition-colors text-xl">×</button>
        </div>

        <div className="p-6 space-y-6">

          {/* Müşteri + Durum */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e] mb-2">
                Müşteri {order.source === "web" && <span className="normal-case text-[#b8a89e]">(web siparişi)</span>}
              </label>
              {order.source === "web" ? (
                <div className="border border-[#e8ddd6] bg-[#faf8f6] px-3 py-2.5 text-sm text-[#2c1810] rounded-sm">
                  <span className="font-medium">{order.recipientName}</span>
                  {order.recipientPhone && <span className="text-[#8b6f5e] ml-2 text-xs">{order.recipientPhone}</span>}
                </div>
              ) : showNewCust ? (
                <div className="border border-[#d4c5ba] bg-[#faf8f6] p-3 rounded-sm space-y-2">
                  <p className="text-xs font-medium text-[#5c4033]">Yeni Müşteri</p>
                  <input value={newCust.name} onChange={(e) => setNewCust((p) => ({ ...p, name: e.target.value }))}
                    placeholder="İsim *" autoFocus
                    className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e]" />
                  <input value={newCust.phone} onChange={(e) => setNewCust((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Telefon (opsiyonel)"
                    className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e]" />
                  <div className="flex gap-2">
                    <button type="button" onClick={saveNewCustomer} disabled={!newCust.name.trim() || custSaving}
                      className="flex-1 bg-[#2c1810] text-white text-xs py-2 rounded-sm disabled:opacity-50">
                      {custSaving ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                    <button type="button" onClick={() => setShowNewCust(false)} className="text-xs text-[#8b6f5e] px-3">İptal</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] bg-white">
                    <option value="">Müşteri seçin...</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>)}
                  </select>
                  <div className="flex gap-3">
                    {selectedCust && (
                      <a href={`/admin/musteriler/${selectedCust.id}`} target="_blank" rel="noreferrer"
                        className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">Profil →</a>
                    )}
                    <button type="button" onClick={() => setShowNewCust(true)} className="text-xs text-[#5c4033] hover:text-[#2c1810] font-medium">
                      + Yeni müşteri ekle
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e] mb-2">Sipariş Durumu</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] bg-white">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Teslimat */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e] mb-2">Teslimat Yöntemi</label>
            <div className="flex gap-2">
              {Object.entries(DELIVERY_LABELS).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setDeliveryMethod(k)}
                  className={`px-5 py-2.5 text-sm font-medium border rounded-sm transition-colors ${deliveryMethod === k ? "bg-[#2c1810] text-white border-[#2c1810]" : "border-[#d4c5ba] text-[#5c4033] hover:bg-[#f5f0eb]"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Ürünler */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e] mb-3">Ürünler</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="border border-[#e8ddd6] rounded-sm bg-[#faf8f6] p-3 space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <ProductInput item={item} idx={idx} products={products} onChange={changeItem} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-[#8b6f5e]">Adet</label>
                      <input type="number" min="1" value={item.qty}
                        onChange={(e) => changeItem(idx, "qty", Number(e.target.value))}
                        className="w-16 border border-[#d4c5ba] rounded-sm px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[#8b6f5e] bg-white" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-[#8b6f5e]">Fiyat (₺)</label>
                      <input type="number" min="0" value={item.price}
                        onChange={(e) => changeItem(idx, "price", Number(e.target.value))}
                        className="w-24 border border-[#d4c5ba] rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-[#8b6f5e] bg-white" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] text-[#8b6f5e]">Toplam</label>
                      <div className="w-24 px-2 py-1.5 text-sm font-medium text-[#2c1810] bg-white border border-[#e8ddd6] rounded-sm text-right">
                        {(item.qty * item.price).toLocaleString("tr-TR")} ₺
                      </div>
                    </div>
                    {items.length > 1 && (
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] invisible">—</label>
                        <button type="button" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                          className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 border border-red-100 rounded-sm hover:bg-red-50 transition-colors">✕</button>
                      </div>
                    )}
                  </div>
                  {/* Yeni ürün ekleme butonu her satırda */}
                  {newProdIdx === idx ? (
                    <div className="border-t border-[#e8ddd6] pt-2 space-y-2">
                      <p className="text-xs font-medium text-[#5c4033]">Yeni Ürün Ekle</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={newProd.name} onChange={(e) => setNewProd((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Ürün adı *" autoFocus
                          className="border border-[#d4c5ba] rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-[#8b6f5e]" />
                        <input value={newProd.price} onChange={(e) => setNewProd((p) => ({ ...p, price: e.target.value }))}
                          placeholder="Satış fiyatı *" type="number"
                          className="border border-[#d4c5ba] rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-[#8b6f5e]" />
                        <input value={newProd.costPrice} onChange={(e) => setNewProd((p) => ({ ...p, costPrice: e.target.value }))}
                          placeholder="Maliyet fiyatı" type="number"
                          className="border border-[#d4c5ba] rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-[#8b6f5e]" />
                        <select value={newProd.categoryId} onChange={(e) => setNewProd((p) => ({ ...p, categoryId: e.target.value }))}
                          className="border border-[#d4c5ba] rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-[#8b6f5e] bg-white">
                          <option value="">Kategori seç</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={newProd.brandId} onChange={(e) => setNewProd((p) => ({ ...p, brandId: e.target.value }))}
                          className="border border-[#d4c5ba] rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-[#8b6f5e] bg-white">
                          <option value="">Marka seç</option>
                          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveNewProduct(idx)} disabled={!newProd.name.trim() || !newProd.price || prodSaving}
                          className="flex-1 bg-[#2c1810] text-white text-xs py-1.5 rounded-sm disabled:opacity-50">
                          {prodSaving ? "Kaydediliyor..." : "Ürünü Kaydet & Seç"}
                        </button>
                        <button type="button" onClick={() => setNewProdIdx(null)} className="text-xs text-[#8b6f5e] px-3">İptal</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setNewProdIdx(idx); setNewProd({ name: item.name, price: String(item.price || ""), costPrice: "", categoryId: "", brandId: "" }); }}
                      className="text-[11px] text-[#8b6f5e] hover:text-[#2c1810] transition-colors">
                      + Listede yoksa yeni ürün ekle
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setItems((p) => [...p, { productId: null, name: "", qty: 1, price: 0 }])}
              className="mt-2 text-xs text-[#5c4033] hover:text-[#2c1810] font-medium border border-dashed border-[#d4c5ba] rounded-sm px-4 py-2 w-full hover:bg-[#faf8f6] transition-colors">
              + Ürün Satırı Ekle
            </button>
          </div>

          {/* Tutar */}
          <div className="border border-[#e8ddd6] rounded-sm p-4 bg-[#faf8f6] space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e] mb-1.5">
                  Toplam Tutar (₺)
                  {totalEdited && <span className="ml-2 normal-case text-[#b8a89e]">manuel</span>}
                </label>
                <input type="number" min="0" value={manualTotal}
                  onChange={(e) => { setManualTotal(e.target.value); setTotalEdited(true); }}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm text-[#2c1810] font-medium focus:outline-none focus:border-[#8b6f5e] bg-white" />
                {totalEdited && (
                  <button type="button" onClick={() => { setManualTotal(String(autoTotal)); setTotalEdited(false); }}
                    className="text-[10px] text-[#8b6f5e] hover:text-[#2c1810] mt-1">
                    ↺ Otomatik hesapla ({autoTotal.toLocaleString("tr-TR")} ₺)
                  </button>
                )}
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e] mb-1.5">İskonto (₺)</label>
                <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0"
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#8b6f5e] bg-white" />
              </div>
            </div>
            {discountAmt > 0 && (
              <div className="flex items-center gap-2 text-sm border-t border-[#e8ddd6] pt-3">
                <span className="text-[#8b6f5e]">{grossTotal.toLocaleString("tr-TR")} ₺</span>
                <span className="text-[#b8a89e]">−</span>
                <span className="text-orange-600">{discountAmt.toLocaleString("tr-TR")} ₺ iskonto</span>
                <span className="text-[#b8a89e]">=</span>
                <span className="font-semibold text-[#2c1810] text-base">{netTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
            )}
            {/* Alınan Tutar / Ek Ödeme */}
            <div className="border-t border-[#e8ddd6] pt-3">
              {existingDebt ? (
                // Mevcut borç kaydı var → ek ödeme modu
                <div className="space-y-2">
                  <div className="bg-orange-50 border border-orange-200 rounded-sm p-3 text-xs space-y-1">
                    <p className="font-medium text-orange-800">Borç Kaydı Mevcut</p>
                    <p className="text-orange-700">Toplam: {existingDebt.totalAmount.toLocaleString("tr-TR")} ₺ — Ödenen: {existingDebt.paidAmount.toLocaleString("tr-TR")} ₺ — <span className="font-semibold">Kalan: {(existingDebt.totalAmount - existingDebt.paidAmount).toLocaleString("tr-TR")} ₺</span></p>
                  </div>
                  <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e]">
                    Ek Ödeme (₺) <span className="normal-case text-[#b8a89e]">— borç kaydına eklenecek</span>
                  </label>
                  <input type="number" min="0" value={alinanTutar} onChange={(e) => setAlinanTutar(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#8b6f5e] bg-white" />
                  {alinanTutar && Number(alinanTutar) > 0 && (
                    <p className="text-[10px] text-green-700 mt-1">
                      Kalan: {Math.max(0, existingDebt.totalAmount - existingDebt.paidAmount - Number(alinanTutar)).toLocaleString("tr-TR")} ₺
                    </p>
                  )}
                </div>
              ) : (
                // Mevcut borç yok → yeni alınan tutar
                <>
                  <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e] mb-1.5">
                    Alınan Tutar (₺) <span className="normal-case text-[#b8a89e]">— boş bırakılırsa tam ödeme sayılır</span>
                  </label>
                  <input type="number" min="0" value={alinanTutar} onChange={(e) => setAlinanTutar(e.target.value)}
                    placeholder={`${netTotal.toLocaleString("tr-TR")} (tam ödeme)`}
                    className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#8b6f5e] bg-white" />
                  {alinanTutar && Number(alinanTutar) < netTotal && customerId && (
                    <p className="text-[10px] text-orange-600 mt-1">
                      ⚠ {(netTotal - Number(alinanTutar)).toLocaleString("tr-TR")} ₺ borç alacak/borç ekranına kaydedilecek.
                    </p>
                  )}
                  {alinanTutar && Number(alinanTutar) < netTotal && !customerId && (
                    <p className="text-[10px] text-gray-400 mt-1">Borç kaydı için müşteri seçilmeli.</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Kargo */}
          <div className="border border-[#e8ddd6] rounded-sm p-4 bg-[#faf8f6] space-y-3">
            <p className="text-[10px] tracking-widest uppercase text-[#8b6f5e]">Kargo Bilgisi</p>
            {(deliveryMethod === "PICKUP" || deliveryMethod === "STORE") ? (
              <p className="text-xs text-[#b8a89e]">Mağaza teslim seçildiğinde kargo bilgisi girilmez.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e] mb-1.5">Kargo Firması</label>
                  <select value={editCargoCompany} onChange={(e) => setEditCargoCompany(e.target.value)}
                    className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#8b6f5e] bg-white">
                    <option value="">Seçiniz</option>
                    {["Yurtiçi Kargo", "MNG Kargo", "Aras Kargo", "PTT Kargo", "Sürat Kargo", "DHL", "UPS"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e] mb-1.5">Takip Numarası</label>
                  <input type="text" value={editTrackingNo} onChange={(e) => setEditTrackingNo(e.target.value)}
                    placeholder="Takip kodu girin..."
                    className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#8b6f5e] bg-white" />
                </div>
              </div>
            )}
          </div>

          {/* Not */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-[#8b6f5e] mb-1.5">Not</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Sipariş notu..."
              className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#8b6f5e] resize-none bg-[#faf8f6]" />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#e8ddd6] px-6 py-4 flex gap-3">
          <button type="button" onClick={handleSave} disabled={pending}
            className="flex-1 bg-[#2c1810] text-[#f5f0eb] py-3 text-sm tracking-widest uppercase font-light hover:bg-[#3d2418] disabled:opacity-50 transition-colors">
            {pending ? "Kaydediliyor..." : `Kaydet — ${netTotal.toLocaleString("tr-TR")} ₺`}
          </button>
          <button type="button" onClick={onClose}
            className="px-6 py-3 border border-[#d4c5ba] text-sm text-[#5c4033] hover:bg-[#f5f0eb] transition-colors">
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
