"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Field, SubmitRow } from "./FormField";
import {
  createDepoSiparis,
  iletDepoSiparis,
  deleteDepoSiparis,
  type DepoSiparisItem,
} from "@/lib/actions/depo-siparis";

type DepoSiparis = {
  id: string; title: string; orderDate: Date | string;
  items: unknown; total: number; paidAmount: number; supplierName: string | null;
  status: string; notes: string | null; createdAt: Date | string;
};

type ProductSuggestion = { id: string; name: string; costPrice: number | null };

const EMPTY_DEPO = {
  title: "Haftalık Sipariş",
  orderDate: new Date().toISOString().split("T")[0],
  supplierName: "",
  paidAmount: "",
  notes: "",
};
const EMPTY_ITEM = (): DepoSiparisItem => ({ productId: undefined, name: "", qty: 1, unitPrice: 0 });

// ── Ürün arama satırı ────────────────────────────────────────
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
    if (val.length < 1) { setSuggestions([]); setOpen(false); return; }
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
      {/* Ürün adı + autocomplete */}
      <div className="col-span-5 relative" ref={containerRef}>
        <input
          className="w-full border border-[#d4c5ba] px-2 py-1.5 text-sm focus:outline-none focus:border-[#8b6f5e]"
          placeholder="ürün adı ara..."
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

      {/* Adet */}
      <input
        type="number" min="1"
        className="col-span-2 border border-[#d4c5ba] px-2 py-1.5 text-sm text-right focus:outline-none focus:border-[#8b6f5e]"
        value={item.qty}
        onChange={(e) => onUpdate(idx, "qty", e.target.value)}
      />

      {/* Alış fiyatı */}
      <input
        type="number" min="0" step="0.01"
        className="col-span-3 border border-[#d4c5ba] px-2 py-1.5 text-sm text-right focus:outline-none focus:border-[#8b6f5e]"
        placeholder="0.00"
        value={item.unitPrice || ""}
        onChange={(e) => onUpdate(idx, "unitPriceStr", e.target.value)}
      />

      {/* Sil */}
      <button
        type="button"
        onClick={() => onRemove(idx)}
        disabled={!canRemove}
        className="col-span-2 text-red-400 hover:text-red-600 text-xs disabled:opacity-30 text-center py-1.5"
      >
        × Sil
      </button>
    </div>
  );
}

// ── Ana bileşen ──────────────────────────────────────────────
export default function DepoSiparisClient({ siparisler }: { siparisler: DepoSiparis[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [depoModal, setDepoModal] = useState(false);
  const [depoForm, setDepoForm] = useState(EMPTY_DEPO);
  const [depoItems, setDepoItems] = useState<DepoSiparisItem[]>([EMPTY_ITEM()]);

  const total = depoItems.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  const paid = Number(depoForm.paidAmount) || 0;
  const remaining = Math.max(0, total - paid);

  function updateItem(idx: number, field: keyof DepoSiparisItem | "unitPriceStr", value: string) {
    setDepoItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        if (field === "unitPriceStr") return { ...item, unitPrice: Number(value) };
        if (field === "qty") return { ...item, qty: Number(value) };
        if (field === "productId") return { ...item, productId: value || undefined };
        return { ...item, [field]: value };
      })
    );
  }

  function addItem() { setDepoItems((p) => [...p, EMPTY_ITEM()]); }
  function removeItem(idx: number) { setDepoItems((p) => p.filter((_, i) => i !== idx)); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = depoItems.filter((i) => i.name.trim());
    if (validItems.length === 0) return;
    startTransition(async () => {
      await createDepoSiparis({
        title: depoForm.title || "Haftalık Sipariş",
        orderDate: depoForm.orderDate,
        items: validItems,
        paidAmount: paid,
        supplierName: depoForm.supplierName || undefined,
        notes: depoForm.notes || undefined,
      });
      router.refresh();
      setDepoForm(EMPTY_DEPO);
      setDepoItems([EMPTY_ITEM()]);
      setDepoModal(false);
    });
  }

  function handleIlet(id: string) {
    if (confirm("Siparişi depoya iletmek istiyor musunuz?")) {
      startTransition(async () => { await iletDepoSiparis(id); router.refresh(); });
    }
  }

  function handleDelete(id: string) {
    if (confirm("Bu siparişi silmek istiyor musunuz?")) {
      startTransition(async () => { await deleteDepoSiparis(id); router.refresh(); });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Depo Siparişleri</h2>
          <p className="text-xs text-[#8b6f5e] mt-1">Stok sistemini etkilemez — yalnızca depo takibi için</p>
        </div>
        <button onClick={() => setDepoModal(true)} className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
          + Yeni Sipariş
        </button>
      </div>

      {siparisler.length === 0 ? (
        <div className="bg-white border border-[#e8ddd6] rounded-sm py-16 text-center text-sm text-[#b8a89e]">
          Henüz depo siparişi yok.
        </div>
      ) : (
        <div className="space-y-4">
          {siparisler.map((ds) => {
            const items = ds.items as DepoSiparisItem[];
            const isIletildi = ds.status === "ILETILDI";
            const dsRemaining = ds.total - ds.paidAmount;
            return (
              <div key={ds.id} className={`bg-white border rounded-sm overflow-hidden ${isIletildi ? "border-green-200" : "border-[#e8ddd6]"}`}>
                <div className={`flex items-center justify-between px-6 py-4 ${isIletildi ? "bg-green-50" : "bg-[#faf8f6]"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium tracking-wide ${isIletildi ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {isIletildi ? "İletildi" : "Hazırlanıyor"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#2c1810]">{ds.title}</p>
                      <p className="text-[11px] text-[#8b6f5e]">
                        {new Date(ds.orderDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                        {ds.supplierName && <span className="ml-2 text-[#8b6f5e]">· {ds.supplierName}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-[#2c1810]">{Number(ds.total).toLocaleString("tr-TR")} ₺</p>
                      {dsRemaining > 0 && (
                        <p className="text-[11px] text-red-600">Kalan borç: {dsRemaining.toLocaleString("tr-TR")} ₺</p>
                      )}
                      {dsRemaining === 0 && ds.paidAmount > 0 && (
                        <p className="text-[11px] text-green-600">Ödendi</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isIletildi && (
                        <button onClick={() => handleIlet(ds.id)} className="text-xs bg-[#2c1810] text-white px-4 py-2 hover:bg-[#3d2418] transition-colors tracking-wide">
                          Depoya İlet
                        </button>
                      )}
                      <button onClick={() => handleDelete(ds.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-2">
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
                      {items.map((item, i) => (
                        <tr key={i} className="border-b border-[#f9f6f3] last:border-0">
                          <td className="py-2 text-[#2c1810]">{item.name}</td>
                          <td className="py-2 text-right text-[#5c4033]">{item.qty}</td>
                          <td className="py-2 text-right text-[#5c4033]">{Number(item.unitPrice).toLocaleString("tr-TR")} ₺</td>
                          <td className="py-2 text-right font-medium text-[#2c1810]">{(item.qty * item.unitPrice).toLocaleString("tr-TR")} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ds.notes && (
                    <p className="mt-3 text-xs text-[#8b6f5e] italic border-t border-[#f0ebe6] pt-2">Not: {ds.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Yeni Sipariş Modal ── */}
      <Modal open={depoModal} onClose={() => setDepoModal(false)} title="Yeni Depo Siparişi">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sipariş Başlığı" required value={depoForm.title} onChange={(e) => setDepoForm((p) => ({ ...p, title: e.target.value }))} placeholder="Haftalık Sipariş" />
            <Field label="Sipariş Tarihi" required type="date" value={depoForm.orderDate} onChange={(e) => setDepoForm((p) => ({ ...p, orderDate: e.target.value }))} />
          </div>

          <Field label="Tedarikçi Adı" value={depoForm.supplierName} onChange={(e) => setDepoForm((p) => ({ ...p, supplierName: e.target.value }))} placeholder="Depo / tedarikçi adı" />

          {/* Ürün satırları */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-[#8b6f5e] font-medium">Ürünler</label>
              <button type="button" onClick={addItem} className="text-xs text-[#2c1810] hover:underline">+ Satır Ekle</button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wide text-[#8b6f5e] px-1">
                <span className="col-span-5">Ürün Adı</span>
                <span className="col-span-2 text-right">Adet</span>
                <span className="col-span-3 text-right">Alış Fiyatı (₺)</span>
                <span className="col-span-2"></span>
              </div>
              {depoItems.map((item, idx) => (
                <ItemRow
                  key={idx}
                  item={item}
                  idx={idx}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  canRemove={depoItems.length > 1}
                />
              ))}
            </div>

            {/* Toplam + ödeme */}
            <div className="mt-4 pt-4 border-t border-[#f0ebe6] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8b6f5e]">Sipariş Toplamı</span>
                <span className="text-lg font-semibold text-[#2c1810]">{total.toLocaleString("tr-TR")} ₺</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-[#5c4033] whitespace-nowrap">Ödenen Tutar (₺)</label>
                <input
                  type="number" min="0" step="0.01"
                  className="flex-1 border border-[#d4c5ba] px-3 py-1.5 text-sm text-right focus:outline-none focus:border-[#8b6f5e]"
                  placeholder="0.00"
                  value={depoForm.paidAmount}
                  onChange={(e) => setDepoForm((p) => ({ ...p, paidAmount: e.target.value }))}
                />
              </div>

              {remaining > 0 && (
                <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                  <span className="text-xs text-red-600">Tedarikçi borcu olarak eklenecek</span>
                  <span className="text-sm font-semibold text-red-600">{remaining.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
              {paid > 0 && remaining === 0 && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-sm px-3 py-2">
                  <span className="text-xs text-green-600">Tamamen ödendi</span>
                  <span className="text-sm font-semibold text-green-600">{total.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
            </div>
          </div>

          <Field label="Notlar" value={depoForm.notes} onChange={(e) => setDepoForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Öncelikli ürünler, teslimat notu..." />

          <SubmitRow onCancel={() => setDepoModal(false)} label={isPending ? "Kaydediliyor..." : "Sipariş Oluştur"} />
        </form>
      </Modal>
    </div>
  );
}
