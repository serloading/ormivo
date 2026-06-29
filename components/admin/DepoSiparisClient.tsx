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
  title: "HaftalÄ±k SipariÅŸ",
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
}: {
  item: DepoSiparisItem;
  idx: number;
  onUpdate: (idx: number, field: keyof DepoSiparisItem | "unitPriceStr", value: string) => void;
  onRemove: (idx: number) => void;
  canRemove: boolean;
}) {
  const [query, setQuery] = useState(item.name);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-5 relative" ref={containerRef}>
        <input
          className="w-full border border-[#d4c5ba] px-2 py-1.5 text-sm focus:outline-none focus:border-[#8b6f5e]"
          placeholder="Ã¼rÃ¼n adÄ± ara..."
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
                  <span className="ml-2 text-[11px] text-[#8b6f5e]">{s.costPrice.toLocaleString("tr-TR")} â‚º</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        type="number"
        min="1"
        className="col-span-2 border border-[#d4c5ba] px-2 py-1.5 text-sm text-right focus:outline-none focus:border-[#8b6f5e]"
        value={item.qty}
        onChange={(e) => onUpdate(idx, "qty", e.target.value)}
      />

      <input
        type="number"
        min="0"
        step="0.01"
        className="col-span-3 border border-[#d4c5ba] px-2 py-1.5 text-sm text-right focus:outline-none focus:border-[#8b6f5e]"
        placeholder="0.00"
        value={item.unitPrice || ""}
        onChange={(e) => onUpdate(idx, "unitPriceStr", e.target.value)}
      />

      <button
        type="button"
        onClick={() => onRemove(idx)}
        disabled={!canRemove}
        className="col-span-2 text-red-400 hover:text-red-600 text-xs disabled:opacity-30 text-center py-1.5"
      >
        Ã— Sil
      </button>
    </div>
  );
}

export default function DepoSiparisClient({ siparisler }: { siparisler: DepoSiparis[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [items, setItems] = useState<DepoSiparisItem[]>([EMPTY_ITEM()]);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(EMPTY_SUPPLIER_FORM);

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
      title: form.title || "HaftalÄ±k SipariÅŸ",
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
      `Depo sipariÅŸi: ${order.title}`,
      `Tarih: ${new Date(order.orderDate).toLocaleDateString("tr-TR")}`,
      "",
      ...itemsForMsg.map((item) => `- ${item.name} Ã—${item.qty} = ${(item.qty * item.unitPrice).toLocaleString("tr-TR")} â‚º`),
      "",
      `ÃœrÃ¼n toplamÄ±: ${itemsTotal.toLocaleString("tr-TR")} â‚º`,
      `Kargo: ${shippingFee.toLocaleString("tr-TR")} â‚º`,
      `Genel toplam: ${grandTotal.toLocaleString("tr-TR")} â‚º`,
    ].join("\n");

    const url = buildWhatsAppUrl(phone, message);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      alert("Bu sipariÅŸ iÃ§in depo telefonu girilmemiÅŸ.");
      return;
    }

    startTransition(async () => {
      await iletDepoSiparis(order.id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (confirm("Bu sipariÅŸi silmek istiyor musunuz?")) {
      startTransition(async () => {
        await deleteDepoSiparis(id);
        router.refresh();
      });
    }
  }

  return (
    <div>
            <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Depo Sipariþleri</h2>
          <p className="text-xs text-[#8b6f5e] mt-1">Stok sistemini etkilemez - yalnýzca depo takibi için</p>
        </div>
        <div className="flex items-center gap-3">
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
            + Yeni Sipariþ
          </button>
        </div>
      </div>

      {siparisler.length === 0 ? (
        <div className="bg-white border border-[#e8ddd6] rounded-sm py-16 text-center text-sm text-[#b8a89e]">
          HenÃ¼z depo sipariÅŸi yok.
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
                      {isSent ? "Ä°letildi" : "HazÄ±rlanÄ±yor"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#2c1810]">{order.title}</p>
                      <p className="text-[11px] text-[#8b6f5e]">
                        {new Date(order.orderDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                        {(order.depoName || order.supplierName) && <span className="ml-2 text-[#8b6f5e]">Â· {order.depoName || order.supplierName}</span>}
                        {order.depoPhone && <span className="ml-2 text-[#8b6f5e]">Â· {order.depoPhone}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-[#2c1810]">{total.toLocaleString("tr-TR")} â‚º</p>
                      <p className="text-[11px] text-[#8b6f5e]">
                        ÃœrÃ¼n: {productTotal.toLocaleString("tr-TR")} â‚º Â· Kargo: {shipping.toLocaleString("tr-TR")} â‚º
                      </p>
                      {remainingAmount > 0 && (
                        <p className="text-[11px] text-red-600">Kalan borÃ§: {remainingAmount.toLocaleString("tr-TR")} â‚º</p>
                      )}
                      {remainingAmount === 0 && paidAmount > 0 && <p className="text-[11px] text-green-600">Ã–dendi</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(order)}
                        className="text-xs text-[#8b6f5e] hover:text-[#2c1810] px-2 py-2"
                      >
                        DÃ¼zenle
                      </button>
                      {!isSent && (
                        <button
                          onClick={() => handleIlet(order)}
                          className="text-xs bg-[#2c1810] text-white px-4 py-2 hover:bg-[#3d2418] transition-colors tracking-wide"
                        >
                          Depoya Ä°let
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
                        <th className="pb-2 text-[11px] uppercase tracking-wide text-[#8b6f5e] font-medium">ÃœrÃ¼n AdÄ±</th>
                        <th className="pb-2 text-[11px] uppercase tracking-wide text-[#8b6f5e] font-medium text-right">Adet</th>
                        <th className="pb-2 text-[11px] uppercase tracking-wide text-[#8b6f5e] font-medium text-right">AlÄ±ÅŸ FiyatÄ±</th>
                        <th className="pb-2 text-[11px] uppercase tracking-wide text-[#8b6f5e] font-medium text-right">Toplam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalizedItems.map((item, index) => (
                        <tr key={index} className="border-b border-[#f9f6f3] last:border-0">
                          <td className="py-2 text-[#2c1810]">{item.name}</td>
                          <td className="py-2 text-right text-[#5c4033]">{item.qty}</td>
                          <td className="py-2 text-right text-[#5c4033]">{Number(item.unitPrice).toLocaleString("tr-TR")} â‚º</td>
                          <td className="py-2 text-right font-medium text-[#2c1810]">{(item.qty * item.unitPrice).toLocaleString("tr-TR")} â‚º</td>
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
        title={editingId ? "Depo SipariÅŸi DÃ¼zenle" : "Yeni Depo SipariÅŸi"}
        width="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="SipariÅŸ BaÅŸlÄ±ÄŸÄ±" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="HaftalÄ±k SipariÅŸ" />
            <Field label="SipariÅŸ Tarihi" required type="date" value={form.orderDate} onChange={(e) => setForm((p) => ({ ...p, orderDate: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Depo AdÄ±" required value={form.depoName} onChange={(e) => setForm((p) => ({ ...p, depoName: e.target.value }))} placeholder="Depo adÄ±" />
            <Field label="Depo Telefonu" required value={form.depoPhone} onChange={(e) => setForm((p) => ({ ...p, depoPhone: e.target.value }))} placeholder="05XX XXX XX XX" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Kargo Ãœcreti"
              type="number"
              min="0"
              step="0.01"
              value={form.shippingFee}
              onChange={(e) => setForm((p) => ({ ...p, shippingFee: e.target.value }))}
              placeholder="0.00"
            />
            <Field
              label="Ã–denen Tutar"
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
              <label className="text-xs uppercase tracking-widest text-[#8b6f5e] font-medium">ÃœrÃ¼nler</label>
              <button type="button" onClick={addItem} className="text-xs text-[#2c1810] hover:underline">+ SatÄ±r Ekle</button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wide text-[#8b6f5e] px-1">
                <span className="col-span-5">ÃœrÃ¼n AdÄ±</span>
                <span className="col-span-2 text-right">Adet</span>
                <span className="col-span-3 text-right">AlÄ±ÅŸ FiyatÄ± (â‚º)</span>
                <span className="col-span-2" />
              </div>
              {items.map((item, idx) => (
                <ItemRow
                  key={idx}
                  item={item}
                  idx={idx}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  canRemove={items.length > 1}
                />
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#f0ebe6] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b6f5e]">ÃœrÃ¼n ToplamÄ±</span>
                <span className="text-sm font-semibold text-[#2c1810]">{itemsTotal.toLocaleString("tr-TR")} â‚º</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b6f5e]">Kargo</span>
                <span className="text-sm font-semibold text-[#2c1810]">{shippingFee.toLocaleString("tr-TR")} â‚º</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b6f5e]">SipariÅŸ ToplamÄ±</span>
                <span className="text-lg font-semibold text-[#2c1810]">{grandTotal.toLocaleString("tr-TR")} â‚º</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b6f5e]">Kalan BorÃ§</span>
                <span className="text-sm font-semibold text-red-600">{remaining.toLocaleString("tr-TR")} â‚º</span>
              </div>
            </div>
          </div>

          <Field label="Notlar" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Ã–ncelikli Ã¼rÃ¼nler, teslimat notu..." />

          <SubmitRow onCancel={closeModal} label={editingId ? "GÃ¼ncelle" : "SipariÅŸ OluÅŸtur"} loading={isPending} />
        </form>
      </Modal>
    </div>
  );
}


