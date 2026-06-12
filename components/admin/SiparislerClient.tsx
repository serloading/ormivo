"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Field, TextareaField, SelectField, SubmitRow } from "./FormField";
import { mockProducts } from "@/lib/mock-data";

type OrderItem = { productName: string; price: number; quantity: number };
type Order = {
  id: string;
  orderNo: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  total: number;
  status: string;
  note: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Onaylandı", color: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "Kargoda", color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "İptal", color: "bg-red-100 text-red-600" },
};

const initialOrders: Order[] = [
  { id: "1", orderNo: "ORV-001", customer: "Ayşe Kaya", phone: "05321112233", items: [{ productName: "Ambra Noir", price: 890, quantity: 1 }], total: 890, status: "DELIVERED", note: "", createdAt: "2024-01-20" },
  { id: "2", orderNo: "ORV-002", customer: "Mehmet Demir", phone: "05454445566", items: [{ productName: "Cedar Oud", price: 1050, quantity: 1 }, { productName: "Rose Eternel", price: 790, quantity: 1 }], total: 1840, status: "SHIPPED", note: "Hediye paketi istedi", createdAt: "2024-02-22" },
];

function nextOrderNo(orders: Order[]) {
  const nums = orders.map((o) => parseInt(o.orderNo.split("-")[1] || "0"));
  const max = nums.length ? Math.max(...nums) : 0;
  return `ORV-${String(max + 1).padStart(3, "0")}`;
}

export default function SiparislerClient() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState<Order | null>(null);

  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(1);
  const [items, setItems] = useState<OrderItem[]>([]);

  function resetForm() {
    setCustomer(""); setPhone(""); setNote("");
    setSelectedProduct(""); setQty(1); setItems([]);
  }

  function addItem() {
    const p = mockProducts.find((p) => p.id === selectedProduct);
    if (!p) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productName === p.name);
      if (existing) return prev.map((i) => i.productName === p.name ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { productName: p.name, price: p.price, quantity: qty }];
    });
  }

  function removeItem(name: string) {
    setItems((prev) => prev.filter((i) => i.productName !== name));
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { alert("En az bir ürün ekleyin."); return; }
    setOrders((prev) => [
      { id: Date.now().toString(), orderNo: nextOrderNo(prev), customer, phone, items, total, status: "PENDING", note, createdAt: new Date().toLocaleDateString("tr-TR") },
      ...prev,
    ]);
    resetForm();
    setModal(false);
  }

  function updateStatus(id: string, status: string) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Siparişler</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">WhatsApp sipariş kayıtları</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
          + Sipariş Gir
        </button>
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Sipariş No", "Müşteri", "Ürünler", "Toplam", "Durum", "Tarih", ""].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => {
              const s = STATUS_LABELS[o.status];
              return (
                <tr key={o.id} className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${i === orders.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-6 py-4 font-medium text-[#2c1810]">{o.orderNo}</td>
                  <td className="px-6 py-4">
                    <p className="text-[#2c1810]">{o.customer}</p>
                    <a href={`https://wa.me/9${o.phone}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8b6f5e] hover:text-green-600">
                      {o.phone}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-[#5c4033] max-w-[200px]">
                    <p className="truncate">{o.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#2c1810]">{o.total.toLocaleString("tr-TR")} ₺</td>
                  <td className="px-6 py-4">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${s.color}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-[#8b6f5e]">{o.createdAt}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => setDetailModal(o)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">Detay</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sipariş Giriş Modal */}
      <Modal open={modal} onClose={() => { setModal(false); resetForm(); }} title="Yeni Sipariş Gir" width="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Müşteri Adı" required value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Ayşe Kaya" />
            <Field label="Telefon (WhatsApp)" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05321112233" />
          </div>

          {/* Ürün ekleme */}
          <div className="border border-[#e8ddd6] rounded-sm p-4">
            <p className="text-xs tracking-widest text-[#5c4033] uppercase mb-3">Ürün Ekle</p>
            <div className="flex gap-2">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]"
              >
                <option value="">Ürün seçin...</option>
                {mockProducts.filter((p) => p.isActive).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString("tr-TR")} ₺</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-16 border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm text-center focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]"
              />
              <button type="button" onClick={addItem} disabled={!selectedProduct} className="bg-[#f5f0eb] border border-[#d4c5ba] text-[#5c4033] text-xs px-4 rounded-sm hover:bg-[#e8ddd6] disabled:opacity-40">
                Ekle
              </button>
            </div>

            {items.length > 0 && (
              <div className="mt-3 space-y-2">
                {items.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between text-sm bg-[#faf8f6] px-3 py-2 rounded-sm">
                    <span className="text-[#2c1810]">{item.productName} × {item.quantity}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#5c4033]">{(item.price * item.quantity).toLocaleString("tr-TR")} ₺</span>
                      <button type="button" onClick={() => removeItem(item.productName)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-medium px-3 pt-2 border-t border-[#e8ddd6]">
                  <span className="text-[#5c4033]">Toplam</span>
                  <span className="text-[#2c1810]">{total.toLocaleString("tr-TR")} ₺</span>
                </div>
              </div>
            )}
          </div>

          <TextareaField label="Not" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hediye paketi, özel not..." />
          <SubmitRow onCancel={() => { setModal(false); resetForm(); }} label="Siparişi Kaydet" />
        </form>
      </Modal>

      {/* Detay Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`Sipariş: ${detailModal?.orderNo}`}>
        {detailModal && (
          <div className="space-y-4">
            <div className="space-y-3">
              {[["Müşteri", detailModal.customer], ["Telefon", detailModal.phone], ["Tarih", detailModal.createdAt]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-[#f0ebe6] pb-2">
                  <span className="text-[#8b6f5e]">{k}</span>
                  <span className="text-[#2c1810] font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs tracking-widest text-[#5c4033] uppercase mb-2">Ürünler</p>
              {detailModal.items.map((item) => (
                <div key={item.productName} className="flex justify-between text-sm py-1.5">
                  <span className="text-[#2c1810]">{item.productName} × {item.quantity}</span>
                  <span className="text-[#5c4033]">{(item.price * item.quantity).toLocaleString("tr-TR")} ₺</span>
                </div>
              ))}
              <div className="flex justify-between font-medium text-sm border-t border-[#e8ddd6] pt-2 mt-2">
                <span>Toplam</span>
                <span>{detailModal.total.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
            {detailModal.note && (
              <div className="bg-[#faf8f6] rounded-sm p-3 text-sm text-[#5c4033]">
                <span className="text-xs text-[#8b6f5e] uppercase tracking-widest block mb-1">Not</span>
                {detailModal.note}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
