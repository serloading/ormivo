"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Field, TextareaField, SubmitRow } from "./FormField";
import { createOrder, updateOrderStatus, deleteOrder } from "@/lib/actions/order";
import { createCustomerDebt } from "@/lib/actions/debt";
import { addManualOrderToDepo } from "@/lib/actions/depo-siparis";

type OrderItem = { productName: string; price: number; quantity: number };
type Customer = { id: string; name: string; phone: string | null };
type Product = { id: string; name: string; price: number | string; isActive: boolean };
type Order = {
  id: string; orderNo: string; total: number | string;
  shippingFee?: number | string | null;
  status: string; note: string | null; createdAt: Date | string;
  customer: Customer; items: unknown;
};

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Bekliyor",      color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Onaylandı",     color: "bg-blue-100 text-blue-700" },
  SHIPPED:   { label: "Gönderildi",    color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "İptal",         color: "bg-red-100 text-red-600" },
};

export default function SiparislerClient({
  orders,
  customers,
  products,
}: {
  orders: Order[];
  customers: Customer[];
  products: Product[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [selProduct, setSelProduct] = useState("");
  const [qty, setQty] = useState(1);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [freeShipping, setFreeShipping]     = useState(true);
  const [shippingFee, setShippingFee]       = useState("");
  const [paymentType, setPaymentType]       = useState<"tam" | "kismi" | "veresiye">("tam");
  const [paidAmount,  setPaidAmount]        = useState("");
  const [debtDueDate, setDebtDueDate]       = useState("");
  const [sendToDepot, setSendToDepot]       = useState(false);

  function reset() {
    setCustomerId(""); setNote(""); setSelProduct(""); setQty(1);
    setItems([]); setFreeShipping(true); setShippingFee("");
    setPaymentType("tam"); setPaidAmount(""); setDebtDueDate(""); setSendToDepot(false);
  }

  function addItem() {
    const p = products.find((p) => p.id === selProduct);
    if (!p) return;
    const price = Number(p.price);
    setItems((prev) => {
      const ex = prev.find((i) => i.productName === p.name);
      if (ex) return prev.map((i) => i.productName === p.name ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { productName: p.name, price, quantity: qty }];
    });
  }

  const itemsTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = freeShipping ? 0 : Number(shippingFee) || 0;
  const grandTotal = itemsTotal + shipping;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) { alert("En az bir ürün ekleyin."); return; }
    if (!customerId) { alert("Müşteri seçin."); return; }
    startTransition(async () => {
      try {
        const order = await createOrder({
          customerId,
          items,
          total: grandTotal,
          shippingFee: freeShipping ? null : shipping,
          note: note || undefined,
        });
        // Borç/alacak kaydı oluştur
        if (paymentType === "veresiye") {
          await createCustomerDebt({
            customerId,
            orderId: order?.id,
            description: `Sipariş #${order?.orderNo ?? ""} — veresiye`,
            totalAmount: grandTotal,
            initialPayment: 0,
            dueDate: debtDueDate || undefined,
          });
        } else if (paymentType === "kismi") {
          const paid = parseFloat(paidAmount) || 0;
          await createCustomerDebt({
            customerId,
            orderId: order?.id,
            description: `Sipariş #${order?.orderNo ?? ""} — kısmi ödeme`,
            totalAmount: grandTotal,
            initialPayment: paid,
            dueDate: debtDueDate || undefined,
          });
        }

        if (sendToDepot && order?.id) {
          const depotResult = await addManualOrderToDepo(order.id);
          if (depotResult?.success === false) {
            alert(depotResult.error ?? "Sipariş depoya aktarılamadı.");
          }
        }

        router.refresh();
        reset(); setModal(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Sipariş kaydedilemedi.");
      }
    });
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      await updateOrderStatus(id, status as never);
      router.refresh();
    });
  }

  function handleSendToDepot(id: string) {
    if (!confirm("Bu siparişi depo siparişine eklemek istiyor musunuz?")) return;
    startTransition(async () => {
      await addManualOrderToDepo(id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (confirm("Siparişi silmek istediğinize emin misiniz?")) {
      startTransition(async () => {
        await deleteOrder(id);
        router.refresh();
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">Siparişler</h2>
          <p className="text-sm text-[#8b6f5e] mt-1">{orders.length} sipariş</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">+ Sipariş Gir</button>
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Sipariş No", "Müşteri", "Ürünler", "Toplam", "Kargo", "Durum", "Tarih", ""].map((h) => (
                <th key={h} className="text-left px-5 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-[#b8a89e]">Henüz sipariş yok.</td></tr>
            )}
            {orders.map((o, i) => {
              const parsed = (o.items as OrderItem[]) ?? [];
              const s = STATUS[o.status] ?? STATUS.PENDING;
              return (
                <tr key={o.id} className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${i === orders.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-5 py-4 font-medium text-[#2c1810]">{o.orderNo}</td>
                  <td className="px-5 py-4">
                    <p className="text-[#2c1810]">{o.customer.name}</p>
                    {o.customer.phone && (
                      <a href={`https://wa.me/${(function(p){const d=p.replace(/\D/g,"");return d.startsWith("90")?d:d.startsWith("0")?"9"+d:"90"+d;})(o.customer.phone)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8b6f5e] hover:text-green-600">{o.customer.phone}</a>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[#5c4033] max-w-[160px]">
                    <p className="truncate">{parsed.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</p>
                  </td>
                  <td className="px-5 py-4 font-medium text-[#2c1810] whitespace-nowrap">{Number(o.total).toLocaleString("tr-TR")} ₺</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {o.shippingFee === null || o.shippingFee === undefined
                      ? <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">Ücretsiz</span>
                      : <span className="text-xs text-[#5c4033]">{Number(o.shippingFee).toLocaleString("tr-TR")} ₺</span>}
                  </td>
                  <td className="px-5 py-4">
                    <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${s.color}`}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-[#8b6f5e] whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString("tr-TR")}</td>
                  <td className="px-5 py-4 flex gap-3">
                    <button onClick={() => setDetail(o)} className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">Detay</button>
                    <button onClick={() => handleDelete(o.id)} className="text-xs text-red-400 hover:text-red-600">Sil</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Yeni Sipariş Modal */}
      <Modal open={modal} onClose={() => { setModal(false); reset(); }} title="Yeni Sipariş Gir" width="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs tracking-widest text-[#5c4033] uppercase mb-1.5">Müşteri</label>
            <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
              <option value="">Müşteri seçin...</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>)}
            </select>
          </div>

          {/* Ürün ekleme */}
          <div className="border border-[#e8ddd6] rounded-sm p-4">
            <p className="text-xs tracking-widest text-[#5c4033] uppercase mb-3">Ürün Ekle</p>
            <div className="flex gap-2">
              <select value={selProduct} onChange={(e) => setSelProduct(e.target.value)}
                className="flex-1 border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
                <option value="">Ürün seçin...</option>
                {products.filter((p) => p.isActive).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {Number(p.price).toLocaleString("tr-TR")} ₺</option>
                ))}
              </select>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))}
                className="w-16 border border-[#d4c5ba] rounded-sm px-2 py-2.5 text-sm text-center focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]" />
              <button type="button" onClick={addItem} disabled={!selProduct}
                className="bg-[#f5f0eb] border border-[#d4c5ba] text-[#5c4033] text-xs px-4 rounded-sm hover:bg-[#e8ddd6] disabled:opacity-40">Ekle</button>
            </div>
            {items.length > 0 && (
              <div className="mt-3 space-y-2">
                {items.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between text-sm bg-[#faf8f6] px-3 py-2 rounded-sm">
                    <span className="text-[#2c1810]">{item.productName} × {item.quantity}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#5c4033]">{(item.price * item.quantity).toLocaleString("tr-TR")} ₺</span>
                      <button type="button" onClick={() => setItems((p) => p.filter((i) => i.productName !== item.productName))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kargo ücreti */}
          <div className="border border-[#e8ddd6] rounded-sm p-4">
            <p className="text-xs tracking-widest text-[#5c4033] uppercase mb-3">Kargo Ücreti</p>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={freeShipping} onChange={() => setFreeShipping(true)}
                  className="accent-[#2c1810]" />
                <span className="text-sm text-[#2c1810]">Ücretsiz Kargo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!freeShipping} onChange={() => setFreeShipping(false)}
                  className="accent-[#2c1810]" />
                <span className="text-sm text-[#2c1810]">Ücretli Kargo</span>
              </label>
            </div>
            {!freeShipping && (
              <div className="mt-3">
                <input type="number" min={0} value={shippingFee} onChange={(e) => setShippingFee(e.target.value)}
                  placeholder="Kargo ücreti (₺)" className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2.5 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]" />
              </div>
            )}
          </div>

          {/* Toplam */}
          {items.length > 0 && (
            <div className="bg-[#faf8f6] border border-[#e8ddd6] rounded-sm p-4 space-y-2">
              <div className="flex justify-between text-sm text-[#5c4033]">
                <span>Ürünler</span>
                <span>{itemsTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between text-sm text-[#5c4033]">
                <span>Kargo</span>
                <span>{freeShipping ? "Ücretsiz" : `${shipping.toLocaleString("tr-TR")} ₺`}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[#2c1810] border-t border-[#e8ddd6] pt-2">
                <span>Genel Toplam</span>
                <span>{grandTotal.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
          )}

          {/* Ödeme Durumu */}
          <div className="border border-[#e8ddd6] rounded-sm p-4">
            <p className="text-xs tracking-widest text-[#5c4033] uppercase mb-3">Ödeme Durumu</p>
            <div className="flex flex-wrap gap-3 mb-3">
              {[
                { val: "tam",      label: "Tam Ödendi" },
                { val: "kismi",    label: "Kısmi Ödeme" },
                { val: "veresiye", label: "Veresiye" },
              ].map((opt) => (
                <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="paymentType" value={opt.val}
                    checked={paymentType === opt.val}
                    onChange={() => setPaymentType(opt.val as typeof paymentType)}
                    className="accent-[#2c1810]" />
                  <span className="text-sm text-[#2c1810]">{opt.label}</span>
                </label>
              ))}
            </div>
          {(paymentType === "kismi" || paymentType === "veresiye") && (
            <div className="space-y-2 mt-2">
                {paymentType === "kismi" && (
                  <input type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="Ödenen miktar (₺)" className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]" />
                )}
                <input type="date" value={debtDueDate} onChange={(e) => setDebtDueDate(e.target.value)}
                  className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]" />
                <p className="text-[11px] text-[#8b6f5e]">
                  {paymentType === "veresiye" ? "Tüm tutar Borç/Alacak modülüne kaydedilecek." : "Kalan tutar Borç/Alacak modülüne kaydedilecek."}
                </p>
            </div>
          )}

          <label className="flex items-start gap-2 border border-[#e8ddd6] rounded-sm p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendToDepot}
              onChange={(e) => setSendToDepot(e.target.checked)}
              className="mt-0.5 accent-[#2c1810]"
            />
            <span className="text-sm text-[#2c1810] leading-relaxed">
              Siparişi kaydettikten sonra depoya da ekle
            </span>
          </label>
          </div>

          <TextareaField label="Not" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hediye paketi, özel not..." />
          <SubmitRow onCancel={() => { setModal(false); reset(); }} label="Siparişi Kaydet" />
        </form>
      </Modal>

      {/* Detay Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Sipariş: ${detail?.orderNo}`}>
        {detail && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {[
                ["Müşteri", detail.customer.name],
                ["Telefon", detail.customer.phone || "—"],
                ["Durum", STATUS[detail.status]?.label ?? detail.status],
                ["Tarih", new Date(detail.createdAt).toLocaleDateString("tr-TR")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-[#f0ebe6] pb-2">
                  <span className="text-[#8b6f5e]">{k}</span>
                  <span className="text-[#2c1810] font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs tracking-widest text-[#5c4033] uppercase mb-2">Ürünler</p>
              {((detail.items as OrderItem[]) ?? []).map((item) => (
                <div key={item.productName} className="flex justify-between text-sm py-1.5">
                  <span>{item.productName} × {item.quantity}</span>
                  <span className="text-[#5c4033]">{(item.price * item.quantity).toLocaleString("tr-TR")} ₺</span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-[#5c4033] py-1.5">
                <span>Kargo</span>
                <span>{detail.shippingFee == null ? "Ücretsiz" : `${Number(detail.shippingFee).toLocaleString("tr-TR")} ₺`}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm border-t border-[#e8ddd6] pt-2 mt-1">
                <span>Toplam</span>
                <span>{Number(detail.total).toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSendToDepot(detail.id)}
                className="flex-1 bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-4 py-2 hover:bg-[#3d2418] transition-colors"
              >
                Depoya Aktar
              </button>
            </div>
            {detail.note && (
              <div className="bg-[#faf8f6] rounded-sm p-3 text-sm text-[#5c4033]">
                <span className="text-xs text-[#8b6f5e] uppercase tracking-widest block mb-1">Not</span>
                {detail.note}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
