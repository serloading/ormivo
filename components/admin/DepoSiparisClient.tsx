"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Field, SubmitRow } from "./FormField";
import {
  createDepoSiparis,
  deleteDepoSiparis,
  iletDepoSiparis,
  updateDepoSiparis,
  saveDepoSupplier,
  updateDepoSupplier,
  deleteDepoSupplier,
  type DepoSiparisItem,
} from "@/lib/actions/depo-siparis";
import { createSupplierDebt } from "@/lib/actions/debt";

type DepoSiparis = {
  id: string;
  title: string;
  orderDate: Date | string;
  items: unknown;
  total: number;
  paidAmount: number;
  shippingFee?: number | null;
  depoName?: string | null;
  depoPhone?: string | null;
  supplierName: string | null;
  status: string;
  notes: string | null;
  createdAt: Date | string;
};

type ProductSuggestion = { id: string; name: string; costPrice: number | null };

type FormState = {
  title: string;
  orderDate: string;
  depoName: string;
  depoPhone: string;
  shippingFee: string;
  paidAmount: string;
  notes: string;
};

type SupplierFormState = {
  supplierName: string;
  description: string;
  totalAmount: string;
  initialPayment: string;
  dueDate: string;
};

const EMPTY_FORM: FormState = {
  title: "Haftalık Sipariş",
  orderDate: new Date().toISOString().split("T")[0],
  depoName: "",
  depoPhone: "",
  shippingFee: "",
  paidAmount: "",
  notes: "",
};

const EMPTY_SUPPLIER_FORM: SupplierFormState = {
  supplierName: "",
  description: "",
  totalAmount: "",
  initialPayment: "",
  dueDate: "",
};

const EMPTY_ITEM = (): DepoSiparisItem => ({ productId: undefined, name: "", qty: 1, unitPrice: 0 });

function normalizeItems(raw: unknown): DepoSiparisItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      productId: typeof item?.productId === "string" ? item.productId : undefined,
      name: String(item?.name ?? "").trim(),
      qty: Math.max(1, Number(item?.qty) || 1),
      unitPrice: Math.max(0, Number(item?.unitPrice) || 0),
    }))
    .filter((item) => item.name.length > 0);
}

function toWaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `9${digits}`;
  return `90${digits}`;
}

function buildWhatsAppUrl(phone: string, message: string) {
  const waPhone = toWaPhone(phone);
  if (!waPhone) return "";
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
}

function ItemRow({
  item,
  idx,
  onUpdate,
  onRemove,
  canRemove,
  usdRate,
}: {
  item: DepoSiparisItem;
  idx: number;
  onUpdate: (idx: number, field: keyof DepoSiparisItem | "unitPriceStr", value: string) => void;
  onRemove: (idx: number) => void;
  canRemove: boolean;
  usdRate: number;
}) {
  const [query, setQuery] = useState(item.name);
  const [priceStr, setPriceStr] = useState(item.unitPrice ? String(item.unitPrice) : "");
  const [usdStr, setUsdStr] = useState(() =>
    item.unitPrice && usdRate ? String(Math.round((item.unitPrice / usdRate) * 100) / 100) : ""
  );
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dışarıdan (ürün seçimi) fiyat değişince string state'i senkronize et
  const prevUnitPrice = useRef(item.unitPrice);
  useEffect(() => {
    if (item.unitPrice !== prevUnitPrice.current) {
      prevUnitPrice.current = item.unitPrice;
      setPriceStr(item.unitPrice ? String(item.unitPrice) : "");
      setUsdStr(item.unitPrice && usdRate ? String(Math.round((item.unitPrice / usdRate) * 100) / 100) : "");
    }
  }, [item.unitPrice, usdRate]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    onUpdate(idx, "name", val);
    onUpdate(idx, "productId" as keyof DepoSiparisItem, "");
    if (debounce.current) clearTimeout(debounce.current);
    if (val.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(val)}`);
      const data: ProductSuggestion[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    }, 250);
  }

  function selectSuggestion(s: ProductSuggestion) {
    setQuery(s.name);
    setOpen(false);
    onUpdate(idx, "name", s.name);
    onUpdate(idx, "productId" as keyof DepoSiparisItem, s.id);
    if (s.costPrice != null) {
      onUpdate(idx, "unitPriceStr", String(s.costPrice));
    }
  }

  const lineTotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);

  return (
    <div className="border border-[#e8ddd6] bg-[#fdfcfb] p-3 space-y-2">
      {/* Satır 1: ürün arama */}
      <div className="relative" ref={containerRef}>
        <input
          className="w-full border border-[#d4c5ba] px-2.5 py-2 text-sm focus:outline-none focus:border-[#8b6f5e] bg-white"
          placeholder="Ürün adı ara veya yaz…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {open && (
          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-[#d4c5ba] shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={() => selectSuggestion(s)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-[#faf8f6] border-b border-[#f0ebe6] last:border-0"
              >
                <span className="text-[#2c1810]">{s.name}</span>
                {s.costPrice != null && (
                  <span className="ml-2 text-[11px] text-[#8b6f5e]">{s.costPrice.toLocaleString("tr-TR")} ₺</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Satır 2: adet / fiyat / toplam / sil */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] uppercase tracking-wide text-[#8b6f5e] w-8">Adet</span>
          <input
            type="number"
            min="1"
            className="w-16 border border-[#d4c5ba] px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[#8b6f5e] bg-white"
            value={item.qty}
            onChange={(e) => onUpdate(idx, "qty", e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] uppercase tracking-wide text-[#5e8b73] w-6">$</span>
          <input
            type="text"
            inputMode="decimal"
            className="w-20 border border-[#5e8b73] px-2 py-1.5 text-sm text-right focus:outline-none focus:border-[#3d7a5e] text-[#5e8b73] bg-white"
            placeholder="0.00"
            value={usdStr}
            onChange={(e) => {
              const raw = e.target.value;
              setUsdStr(raw);
              const usd = parseFloat(raw.replace(",", ".")) || 0;
              const tl = Math.round(usd * usdRate * 100) / 100;
              setPriceStr(tl ? String(tl) : "");
              onUpdate(idx, "unitPriceStr", String(tl));
            }}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] uppercase tracking-wide text-[#8b6f5e] w-4">₺</span>
          <input
            type="text"
            inputMode="decimal"
            className="w-24 border border-[#d4c5ba] px-2 py-1.5 text-sm text-right focus:outline-none focus:border-[#8b6f5e] bg-white"
            placeholder="0.00"
            value={priceStr}
            onChange={(e) => {
              const raw = e.target.value;
              setPriceStr(raw);
              const tl = parseFloat(raw.replace(",", ".")) || 0;
              // USD alanını ters hesapla
              setUsdStr(tl && usdRate ? String(Math.round((tl / usdRate) * 100) / 100) : "");
              onUpdate(idx, "unitPriceStr", String(tl));
            }}
          />
        </div>

        <div className="flex-1 text-right text-sm font-semibold text-[#2c1810]">
          {lineTotal > 0 ? `${lineTotal.toLocaleString("tr-TR")} ₺` : ""}
        </div>

        <button
          type="button"
          onClick={() => onRemove(idx)}
          disabled={!canRemove}
          className="text-red-400 hover:text-red-600 text-lg disabled:opacity-20 leading-none px-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function DepoSiparisClient({ siparisler, usdRate, suppliers: initSuppliers }: { siparisler: DepoSiparis[]; usdRate: number; suppliers: { name: string; phone: string }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [items, setItems] = useState<DepoSiparisItem[]>([EMPTY_ITEM()]);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(EMPTY_SUPPLIER_FORM);
  const [supplierMgmtOpen, setSupplierMgmtOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<{ oldName: string; name: string; phone: string } | null>(null);
  const suppliers = initSuppliers;

  const shippingFee = Number(form.shippingFee) || 0;
  const paid = Number(form.paidAmount) || 0;
  const itemsTotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0);
  const grandTotal = itemsTotal + shippingFee;
  const remaining = Math.max(0, grandTotal - paid);

  function updateItem(idx: number, field: keyof DepoSiparisItem | "unitPriceStr", value: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        if (field === "unitPriceStr") return { ...item, unitPrice: Number(value) || 0 };
        if (field === "qty") return { ...item, qty: Math.max(1, Number(value) || 1) };
        if (field === "productId") return { ...item, productId: value || undefined };
        return { ...item, [field]: value };
      }),
    );
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setItems([EMPTY_ITEM()]);
    setEditingId(null);
  }

  function resetSupplierForm() {
    setSupplierForm(EMPTY_SUPPLIER_FORM);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(order: DepoSiparis) {
    const normalizedItems = normalizeItems(order.items);
    setEditingId(order.id);
    setForm({
      title: order.title,
      orderDate: new Date(order.orderDate).toISOString().split("T")[0],
      depoName: order.depoName ?? order.supplierName ?? "",
      depoPhone: order.depoPhone ?? "",
      shippingFee: String(order.shippingFee ?? 0),
      paidAmount: String(order.paidAmount ?? 0),
      notes: order.notes ?? "",
    });
    setItems(normalizedItems.length > 0 ? normalizedItems : [EMPTY_ITEM()]);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  function closeSupplierModal() {
    setSupplierModalOpen(false);
    resetSupplierForm();
  }

  function addItem() {
    setItems((prev) => [...prev, EMPTY_ITEM()]);
  }

  function removeItem(idx: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((item) => item.name.trim());
    if (validItems.length === 0) return;

    const payload = {
      title: form.title || "Haftalık Sipariş",
      orderDate: form.orderDate,
      items: validItems,
      paidAmount: paid,
      shippingFee,
      depoName: form.depoName.trim(),
      depoPhone: form.depoPhone.trim(),
      supplierName: form.depoName.trim(),
      notes: form.notes.trim() || undefined,
    };

    startTransition(async () => {
      if (editingId) {
        await updateDepoSiparis(editingId, payload);
      } else {
        await createDepoSiparis(payload);
      }
      router.refresh();
      closeModal();
    });
  }

  function handleSupplierSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierForm.supplierName.trim() || !supplierForm.description.trim() || !supplierForm.totalAmount.trim()) return;

    startTransition(async () => {
      await createSupplierDebt({
        supplierName: supplierForm.supplierName.trim(),
        description: supplierForm.description.trim(),
        totalAmount: Math.max(0, Number(supplierForm.totalAmount) || 0),
        initialPayment: supplierForm.initialPayment.trim() ? Math.max(0, Number(supplierForm.initialPayment) || 0) : undefined,
        dueDate: supplierForm.dueDate || undefined,
      });
      router.refresh();
      closeSupplierModal();
    });
  }

  function handleIlet(order: DepoSiparis) {
    const itemsForMsg = normalizeItems(order.items);
    const phone = order.depoPhone ?? order.supplierName ?? "";
    const message = [
      `Merhaba ${order.depoName || order.supplierName || "Depo"},`,
      "",
      `Depo siparişi: ${order.title}`,
      `Tarih: ${new Date(order.orderDate).toLocaleDateString("tr-TR")}`,
      "",
      ...itemsForMsg.map((item) => `- ${item.name} ×${item.qty} = ${(item.qty * item.unitPrice).toLocaleString("tr-TR")} ₺`),
      "",
      `Ürün toplamı: ${itemsTotal.toLocaleString("tr-TR")} ₺`,
      `Kargo: ${shippingFee.toLocaleString("tr-TR")} ₺`,
      `Genel toplam: ${grandTotal.toLocaleString("tr-TR")} ₺`,
    ].join("\n");

    const url = buildWhatsAppUrl(phone, message);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      alert("Bu sipariş için depo telefonu girilmemiş.");
      return;
    }

    startTransition(async () => {
      await iletDepoSiparis(order.id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (confirm("Bu siparişi silmek istiyor musunuz?")) {
      startTransition(async () => {
        await deleteDepoSiparis(id);
        router.refresh();
      });
    }
  }

  function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!newSupplierName.trim()) return;
    startTransition(async () => {
      const res = await saveDepoSupplier(newSupplierName.trim(), newSupplierPhone.trim());
      if ("error" in res) { alert(res.error); return; }
      setNewSupplierName(""); setNewSupplierPhone("");
      router.refresh();
    });
  }

  function handleUpdateSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSupplier || !editingSupplier.name.trim()) return;
    startTransition(async () => {
      await updateDepoSupplier(editingSupplier.oldName, editingSupplier.name, editingSupplier.phone);
      setEditingSupplier(null);
      router.refresh();
    });
  }

  function handleDeleteSupplier(name: string) {
    if (!confirm(`"${name}" tedarikçisini silmek istiyor musunuz?`)) return;
    startTransition(async () => {
      await deleteDepoSupplier(name);
      router.refresh();
    });
  }

  function applySupplier(s: { name: string; phone: string }) {
    setForm((p) => ({ ...p, depoName: s.name, depoPhone: s.phone }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Depo Siparişleri</h2>
          <p className="text-xs text-[#8b6f5e] mt-1">Stok sistemini etkilemez - yalnızca depo takibi için</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSupplierMgmtOpen(true)}
            className="border border-[#d4c5ba] text-[#5c4033] text-xs tracking-widest uppercase px-5 py-3 hover:bg-[#f5f0eb] transition-colors"
          >
            Tedarikçiler
          </button>
          <button
            onClick={() => setSupplierModalOpen(true)}
            className="border border-[#d4c5ba] text-[#5c4033] text-xs tracking-widest uppercase px-5 py-3 hover:bg-[#f5f0eb] transition-colors"
          >
            + Tedarikçi Borcu
          </button>
          <button
            onClick={openCreate}
            className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors"
          >
            + Yeni Sipariş
          </button>
        </div>
      </div>

      {siparisler.length === 0 ? (
        <div className="bg-white border border-[#e8ddd6] rounded-sm py-16 text-center text-sm text-[#b8a89e]">
          Henüz depo siparişi yok.
        </div>
      ) : (
        <div className="space-y-4">
          {siparisler.map((order) => {
            const normalizedItems = normalizeItems(order.items);
            const isSent = order.status === "ILETILDI";
            const total = Number(order.total) || 0;
            const paidAmount = Number(order.paidAmount) || 0;
            const shipping = Number(order.shippingFee ?? 0) || 0;
            const productTotal = Math.max(0, total - shipping);
            const remainingAmount = Math.max(0, total - paidAmount);

            return (
              <div key={order.id} className={`bg-white border rounded-sm overflow-hidden ${isSent ? "border-green-200" : "border-[#e8ddd6]"}`}>
                <div className={`flex items-center justify-between px-6 py-4 ${isSent ? "bg-green-50" : "bg-[#faf8f6]"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium tracking-wide ${isSent ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {isSent ? "İletildi" : "Hazırlanıyor"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#2c1810]">{order.title}</p>
                      <p className="text-[11px] text-[#8b6f5e]">
                        {new Date(order.orderDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                        {(order.depoName || order.supplierName) && <span className="ml-2 text-[#8b6f5e]">· {order.depoName || order.supplierName}</span>}
                        {order.depoPhone && <span className="ml-2 text-[#8b6f5e]">· {order.depoPhone}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-[#2c1810]">{total.toLocaleString("tr-TR")} ₺</p>
                      <p className="text-[11px] text-[#8b6f5e]">
                        Ürün: {productTotal.toLocaleString("tr-TR")} ₺ · Kargo: {shipping.toLocaleString("tr-TR")} ₺
                      </p>
                      {remainingAmount > 0 && (
                        <p className="text-[11px] text-red-600">Kalan borç: {remainingAmount.toLocaleString("tr-TR")} ₺</p>
                      )}
                      {remainingAmount === 0 && paidAmount > 0 && <p className="text-[11px] text-green-600">Ödendi</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(order)}
                        className="text-xs text-[#8b6f5e] hover:text-[#2c1810] px-2 py-2"
                      >
                        Düzenle
                      </button>
                      {!isSent && (
                        <button
                          onClick={() => handleIlet(order)}
                          className="text-xs bg-[#2c1810] text-white px-4 py-2 hover:bg-[#3d2418] transition-colors tracking-wide"
                        >
                          Depoya İlet
                        </button>
                      )}
                      <button onClick={() => handleDelete(order.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-2">
                        Sil
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 border-t border-[#f0ebe6]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-[#f0ebe6]">
                        <th className="pb-2 text-[11px] uppercase tracking-wide text-[#8b6f5e] font-medium">Ürün Adı</th>
                        <th className="pb-2 text-[11px] uppercase tracking-wide text-[#8b6f5e] font-medium text-right">Adet</th>
                        <th className="pb-2 text-[11px] uppercase tracking-wide text-[#8b6f5e] font-medium text-right">Alış Fiyatı</th>
                        <th className="pb-2 text-[11px] uppercase tracking-wide text-[#8b6f5e] font-medium text-right">Toplam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalizedItems.map((item, index) => (
                        <tr key={index} className="border-b border-[#f9f6f3] last:border-0">
                          <td className="py-2 text-[#2c1810]">{item.name}</td>
                          <td className="py-2 text-right text-[#5c4033]">{item.qty}</td>
                          <td className="py-2 text-right text-[#5c4033]">{Number(item.unitPrice).toLocaleString("tr-TR")} ₺</td>
                          <td className="py-2 text-right font-medium text-[#2c1810]">{(item.qty * item.unitPrice).toLocaleString("tr-TR")} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {order.notes && (
                    <p className="mt-3 text-xs text-[#8b6f5e] italic border-t border-[#f0ebe6] pt-2">Not: {order.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Depo Siparişi Düzenle" : "Yeni Depo Siparişi"}
        width="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sipariş Başlığı" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Haftalık Sipariş" />
            <Field label="Sipariş Tarihi" required type="date" value={form.orderDate} onChange={(e) => setForm((p) => ({ ...p, orderDate: e.target.value }))} />
          </div>

          {suppliers.length > 0 && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#8b6f5e] font-medium mb-1.5">Kayıtlı Tedarikçi Seç</label>
              <div className="flex flex-wrap gap-2">
                {suppliers.map((s) => (
                  <button key={s.name} type="button" onClick={() => applySupplier(s)}
                    className={`text-xs px-3 py-1.5 border transition-colors ${form.depoName === s.name ? "bg-[#2c1810] text-white border-[#2c1810]" : "border-[#d4c5ba] text-[#5c4033] hover:bg-[#f5f0eb]"}`}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Depo Adı" required value={form.depoName} onChange={(e) => setForm((p) => ({ ...p, depoName: e.target.value }))} placeholder="Depo adı" />
            <Field label="Depo Telefonu" required value={form.depoPhone} onChange={(e) => setForm((p) => ({ ...p, depoPhone: e.target.value }))} placeholder="05XX XXX XX XX" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Kargo Ücreti"
              type="number"
              min="0"
              step="0.01"
              value={form.shippingFee}
              onChange={(e) => setForm((p) => ({ ...p, shippingFee: e.target.value }))}
              placeholder="0.00"
            />
            <Field
              label="Ödenen Tutar"
              type="number"
              min="0"
              step="0.01"
              value={form.paidAmount}
              onChange={(e) => setForm((p) => ({ ...p, paidAmount: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-[#8b6f5e] font-medium">Ürünler</label>
              <button type="button" onClick={addItem} className="text-xs text-[#2c1810] hover:underline">+ Satır Ekle</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <ItemRow
                  key={idx}
                  item={item}
                  idx={idx}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  canRemove={items.length > 1}
                  usdRate={usdRate}
                />
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#f0ebe6] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b6f5e]">Ürün Toplamı</span>
                <span className="text-sm font-semibold text-[#2c1810]">{itemsTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b6f5e]">Kargo</span>
                <span className="text-sm font-semibold text-[#2c1810]">{shippingFee.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b6f5e]">Sipariş Toplamı</span>
                <span className="text-lg font-semibold text-[#2c1810]">{grandTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b6f5e]">Kalan Borç</span>
                <span className="text-sm font-semibold text-red-600">{remaining.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
          </div>

          <Field label="Notlar" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Öncelikli ürünler, teslimat notu..." />

          <SubmitRow onCancel={closeModal} label={editingId ? "Güncelle" : "Sipariş Oluştur"} loading={isPending} />
        </form>
      </Modal>

      <Modal
        open={supplierModalOpen}
        onClose={closeSupplierModal}
        title="Tedarikçi Borcu Ekle"
        width="max-w-lg"
      >
        <form onSubmit={handleSupplierSubmit} className="space-y-4">
          <Field label="Tedarikçi Adı" required value={supplierForm.supplierName} onChange={(e) => setSupplierForm((p) => ({ ...p, supplierName: e.target.value }))} placeholder="Tedarikçi adı" />
          <Field label="Açıklama" required value={supplierForm.description} onChange={(e) => setSupplierForm((p) => ({ ...p, description: e.target.value }))} placeholder="Borç açıklaması" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Toplam Tutar (₺)" required type="number" min="0" step="0.01" value={supplierForm.totalAmount} onChange={(e) => setSupplierForm((p) => ({ ...p, totalAmount: e.target.value }))} placeholder="0.00" />
            <Field label="İlk Ödeme (₺)" type="number" min="0" step="0.01" value={supplierForm.initialPayment} onChange={(e) => setSupplierForm((p) => ({ ...p, initialPayment: e.target.value }))} placeholder="0.00" />
          </div>
          <Field label="Vade Tarihi" type="date" value={supplierForm.dueDate} onChange={(e) => setSupplierForm((p) => ({ ...p, dueDate: e.target.value }))} />
          <SubmitRow onCancel={closeSupplierModal} label="Borç Ekle" loading={isPending} />
        </form>
      </Modal>

      <Modal open={supplierMgmtOpen} onClose={() => setSupplierMgmtOpen(false)} title="Tedarikçi Yönetimi" width="max-w-lg">
        <div className="space-y-5">
          <form onSubmit={handleAddSupplier} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tedarikçi Adı" required value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} placeholder="Depo adı" />
              <Field label="Telefon" value={newSupplierPhone} onChange={(e) => setNewSupplierPhone(e.target.value)} placeholder="05XX XXX XX XX" />
            </div>
            <button type="submit" disabled={isPending || !newSupplierName.trim()}
              className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-5 py-2.5 hover:bg-[#3d2418] transition-colors disabled:opacity-40">
              + Ekle
            </button>
          </form>

          {suppliers.length > 0 && (
            <div className="border-t border-[#e8ddd6] pt-4">
              <p className="text-xs text-[#8b6f5e] uppercase tracking-widest mb-3">Kayıtlı Tedarikçiler</p>
              <div className="space-y-2">
                {suppliers.map((s) => (
                  <div key={s.name} className="border-b border-[#f0ebe6] last:border-0 pb-2">
                    {editingSupplier?.oldName === s.name ? (
                      <form onSubmit={handleUpdateSupplier} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={editingSupplier.name} onChange={(e) => setEditingSupplier((p) => p ? { ...p, name: e.target.value } : p)}
                            className="border border-[#d4c5ba] px-2 py-1.5 text-sm focus:outline-none focus:border-[#8b6f5e]" placeholder="Ad" />
                          <input value={editingSupplier.phone} onChange={(e) => setEditingSupplier((p) => p ? { ...p, phone: e.target.value } : p)}
                            className="border border-[#d4c5ba] px-2 py-1.5 text-sm focus:outline-none focus:border-[#8b6f5e]" placeholder="Telefon" />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={isPending} className="text-xs bg-[#2c1810] text-white px-3 py-1 hover:bg-[#3d2418] disabled:opacity-40">Kaydet</button>
                          <button type="button" onClick={() => setEditingSupplier(null)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">İptal</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <p className="text-sm text-[#2c1810] font-medium">{s.name}</p>
                          {s.phone && <p className="text-xs text-[#8b6f5e]">{s.phone}</p>}
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setEditingSupplier({ oldName: s.name, name: s.name, phone: s.phone })} className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">Düzenle</button>
                          <button onClick={() => handleDeleteSupplier(s.name)} className="text-xs text-red-400 hover:text-red-600">Sil</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
