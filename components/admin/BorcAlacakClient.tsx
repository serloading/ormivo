"use client";

import { useState, useTransition } from "react";
import {
  createCustomerDebt,
  addCustomerPayment,
  deleteCustomerDebt,
  createSupplierDebt,
  addSupplierPayment,
  deleteSupplierDebt,
} from "@/lib/actions/debt";

// ── Types ────────────────────────────────────────────────────
interface Customer { id: string; name: string; phone: string | null; }
interface Order    { id: string; orderNo: string; }
interface Payment  { id: string; amount: number; note: string | null; paidAt: Date; }

interface CDebt {
  id: string; customerId: string; orderId: string | null;
  description: string; totalAmount: number; paidAmount: number;
  dueDate: Date | null; status: string; createdAt: Date;
  customer: Customer; order: Order | null; payments: Payment[];
}
interface SDebt {
  id: string; supplierName: string; description: string;
  totalAmount: number; paidAmount: number;
  dueDate: Date | null; status: string; createdAt: Date;
  payments: Payment[];
}
interface Stats {
  totalReceivable: number; totalOwed: number;
  collectedMonth: number; overdue: number;
}

interface PendingSiteOrder {
  id: string; orderNo: string; createdAt: Date;
  recipientName: string | null; recipientPhone: string | null;
  total: number; items: unknown;
  deliveryMethod: string;
  user: { name: string | null; phone: string } | null;
}

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2 });

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    BEKLIYOR: "bg-yellow-100 text-yellow-800",
    KISMI:    "bg-blue-100 text-blue-800",
    ODENDI:   "bg-green-100 text-green-800",
  };
  const labels: Record<string, string> = { BEKLIYOR: "Bekliyor", KISMI: "Kısmi", ODENDI: "Ödendi" };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function isOverdue(d: CDebt | SDebt) {
  return d.dueDate && new Date(d.dueDate) < new Date() && d.status !== "ODENDI";
}

// ── Modal shell ───────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-medium text-sm tracking-wide">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Input helper ─────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 tracking-wide uppercase">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#8b6f5e]";

// ── Payment History Modal ─────────────────────────────────────
function PaymentHistory({ payments, onClose }: { payments: Payment[]; onClose: () => void }) {
  return (
    <Modal title="Ödeme Geçmişi" onClose={onClose}>
      {payments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Henüz ödeme yapılmamış.</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium">{fmt(p.amount)} ₺</p>
                <p className="text-xs text-gray-400">{p.note ?? "—"}</p>
              </div>
              <p className="text-xs text-gray-400">{new Date(p.paidAt).toLocaleDateString("tr-TR")}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function BorcAlacakClient({
  customerDebts: initCD,
  supplierDebts: initSD,
  customers,
  orders,
  supplierNames: initSN,
  stats,
  pendingSiteOrders,
}: {
  customerDebts: CDebt[];
  supplierDebts: SDebt[];
  customers: Customer[];
  orders: Order[];
  supplierNames: string[];
  stats: Stats;
  pendingSiteOrders: PendingSiteOrder[];
}) {
  const [tab, setTab] = useState<"musteri" | "tedarikci">("musteri");
  const [isPending, startT] = useTransition();

  // Modals
  type Modal =
    | { type: "new-customer" }
    | { type: "new-supplier" }
    | { type: "pay-customer"; debt: CDebt }
    | { type: "pay-supplier"; debt: SDebt }
    | { type: "history-customer"; debt: CDebt }
    | { type: "history-supplier"; debt: SDebt }
    | null;
  const [modal, setModal] = useState<Modal>(null);

  // ── New customer debt form ────────────────────────────────
  const [cdForm, setCdForm] = useState({
    customerId: "", orderId: "", description: "", totalAmount: "",
    initialPayment: "", dueDate: "",
  });

  function submitCdForm() {
    startT(async () => {
      await createCustomerDebt({
        customerId:     cdForm.customerId,
        orderId:        cdForm.orderId || undefined,
        description:    cdForm.description,
        totalAmount:    parseFloat(cdForm.totalAmount),
        initialPayment: cdForm.initialPayment ? parseFloat(cdForm.initialPayment) : undefined,
        dueDate:        cdForm.dueDate || undefined,
      });
      setModal(null);
      setCdForm({ customerId: "", orderId: "", description: "", totalAmount: "", initialPayment: "", dueDate: "" });
    });
  }

  // ── Customer payment form ─────────────────────────────────
  const [cpForm, setCpForm] = useState({ amount: "", note: "" });

  function submitCpForm(debtId: string) {
    startT(async () => {
      await addCustomerPayment({ debtId, amount: parseFloat(cpForm.amount), note: cpForm.note || undefined });
      setModal(null);
      setCpForm({ amount: "", note: "" });
    });
  }

  // ── New supplier debt form ────────────────────────────────
  const [sdForm, setSdForm] = useState({
    supplierName: "", description: "", totalAmount: "",
    initialPayment: "", dueDate: "",
  });
  const [snSuggestions, setSnSuggestions] = useState<string[]>([]);

  function submitSdForm() {
    startT(async () => {
      await createSupplierDebt({
        supplierName:   sdForm.supplierName,
        description:    sdForm.description,
        totalAmount:    parseFloat(sdForm.totalAmount),
        initialPayment: sdForm.initialPayment ? parseFloat(sdForm.initialPayment) : undefined,
        dueDate:        sdForm.dueDate || undefined,
      });
      setModal(null);
      setSdForm({ supplierName: "", description: "", totalAmount: "", initialPayment: "", dueDate: "" });
    });
  }

  // ── Supplier payment form ─────────────────────────────────
  const [spForm, setSpForm] = useState({ amount: "", note: "" });

  function submitSpForm(debtId: string) {
    startT(async () => {
      await addSupplierPayment({ debtId, amount: parseFloat(spForm.amount), note: spForm.note || undefined });
      setModal(null);
      setSpForm({ amount: "", note: "" });
    });
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-light tracking-wide text-[#2c1810]">Borç / Alacak Takibi</h2>
      </div>

      {/* ── STAT KARTLARI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Müşteri Alacaklarımız", value: `${fmt(stats.totalReceivable)} ₺`, color: "text-green-700", bg: "bg-green-50 border-green-200" },
          { label: "Tedarikçi Borcumuz",    value: `${fmt(stats.totalOwed)} ₺`,       color: "text-red-700",   bg: "bg-red-50 border-red-200" },
          { label: "Bu Ay Tahsil",          value: `${fmt(stats.collectedMonth)} ₺`,  color: "text-blue-700",  bg: "bg-blue-50 border-blue-200" },
          { label: "Vadesi Geçmiş",         value: `${stats.overdue}`,                color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
        ].map((s) => (
          <div key={s.label} className={`border rounded p-4 ${s.bg}`}>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="border-b border-gray-200 flex gap-0">
        {([
          { key: "musteri",   label: `Müşteri Alacakları${pendingSiteOrders.length > 0 ? ` (+${pendingSiteOrders.length} web)` : ""}` },
          { key: "tedarikci", label: "Tedarikçi Borçları" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? "border-[#2c1810] text-[#2c1810]" : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────── */}
      {/* MÜŞTERİ ALACAKLARI */}
      {/* ─────────────────────────────────────── */}
      {tab === "musteri" && (
        <div className="space-y-6">
          {/* Web Sipariş Alacakları */}
          {pendingSiteOrders.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-3">Web Sipariş Alacakları ({pendingSiteOrders.length})</h3>
              <div className="overflow-x-auto bg-white border border-purple-100 rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-purple-50 text-left">
                      {["Sipariş No", "Müşteri", "Ürünler", "Teslimat", "Tutar", "Tarih"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-purple-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingSiteOrders.map((o) => {
                      const items = o.items as { name: string; qty: number }[];
                      return (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-700">#{o.orderNo.slice(-8)}</td>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-[#2c1810]">{o.recipientName}</p>
                            {o.recipientPhone && <p className="text-[11px] text-gray-400">{o.recipientPhone}</p>}
                          </td>
                          <td className="px-4 py-2.5 max-w-[200px]">
                            {items.map((item, i) => (
                              <p key={i} className="text-xs text-gray-600 truncate">{item.name} ×{item.qty}</p>
                            ))}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${o.deliveryMethod === "CARGO" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-teal-50 text-teal-700 border-teal-200"}`}>
                              {o.deliveryMethod === "CARGO" ? "Kargo" : "Ofisten Teslim"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-orange-600 whitespace-nowrap">{Number(o.total).toLocaleString("tr-TR")} ₺</td>
                          <td className="px-4 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-right mt-1">
                <span className="text-xs text-gray-500">Toplam beklenen: <span className="font-semibold text-orange-600">{pendingSiteOrders.reduce((s, o) => s + Number(o.total), 0).toLocaleString("tr-TR")} ₺</span></span>
              </div>
            </div>
          )}

          {/* Manuel Alacaklar */}
          <div className="space-y-4">
            {pendingSiteOrders.length > 0 && <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Manuel Alacaklar</h3>}
            <div className="flex justify-end">
            <button
              onClick={() => setModal({ type: "new-customer" })}
              className="bg-[#2c1810] text-white text-xs tracking-wide px-4 py-2 hover:bg-[#3d2418] transition-colors"
            >
              + Yeni Alacak
            </button>
          </div>

          <div className="overflow-x-auto bg-white border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  {["Müşteri", "Açıklama", "Toplam", "Ödenen", "Kalan", "Vade", "Durum", "İşlemler"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] uppercase tracking-wide text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {initCD.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Henüz alacak kaydı yok.</td></tr>
                )}
                {initCD.map((d) => {
                  const remaining = d.totalAmount - d.paidAmount;
                  const overdue   = isOverdue(d);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-[#2c1810]">{d.customer.name}</p>
                        {d.customer.phone && <p className="text-[11px] text-gray-400">{d.customer.phone}</p>}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="truncate text-gray-700">{d.description}</p>
                        {d.order && <p className="text-[11px] text-gray-400">#{d.order.orderNo}</p>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{fmt(d.totalAmount)} ₺</td>
                      <td className="px-4 py-3 whitespace-nowrap text-green-700">{fmt(d.paidAmount)} ₺</td>
                      <td className={`px-4 py-3 whitespace-nowrap font-semibold ${overdue ? "text-red-600" : remaining > 0 ? "text-orange-600" : "text-gray-400"}`}>
                        {fmt(remaining)} ₺
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {d.dueDate
                          ? <span className={overdue ? "text-red-600 font-medium" : "text-gray-600"}>
                              {new Date(d.dueDate).toLocaleDateString("tr-TR")}
                            </span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {d.status !== "ODENDI" && (
                            <button
                              onClick={() => { setCpForm({ amount: "", note: "" }); setModal({ type: "pay-customer", debt: d }); }}
                              className="text-[11px] bg-green-600 text-white px-2.5 py-1 hover:bg-green-700 transition-colors"
                            >
                              Ödeme Al
                            </button>
                          )}
                          <button
                            onClick={() => setModal({ type: "history-customer", debt: d })}
                            className="text-[11px] border border-gray-200 px-2.5 py-1 hover:bg-gray-100 transition-colors"
                            title="Ödeme geçmişi"
                          >
                            Geçmiş
                          </button>
                          <button
                            onClick={() => { if (confirm("Silinsin mi?")) startT(() => deleteCustomerDebt(d.id)); }}
                            className="text-[11px] text-red-400 hover:text-red-600 px-1"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────── */}
      {/* TEDARİKÇİ BORÇLARI */}
      {/* ─────────────────────────────────────── */}
      {tab === "tedarikci" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModal({ type: "new-supplier" })}
              className="bg-[#2c1810] text-white text-xs tracking-wide px-4 py-2 hover:bg-[#3d2418] transition-colors"
            >
              + Yeni Borç
            </button>
          </div>

          <div className="overflow-x-auto bg-white border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  {["Tedarikçi", "Açıklama", "Toplam", "Ödenen", "Kalan", "Vade", "Durum", "İşlemler"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] uppercase tracking-wide text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {initSD.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Henüz borç kaydı yok.</td></tr>
                )}
                {initSD.map((d) => {
                  const remaining = d.totalAmount - d.paidAmount;
                  const overdue   = isOverdue(d);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#2c1810] whitespace-nowrap">{d.supplierName}</td>
                      <td className="px-4 py-3 max-w-[200px]"><p className="truncate text-gray-700">{d.description}</p></td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{fmt(d.totalAmount)} ₺</td>
                      <td className="px-4 py-3 whitespace-nowrap text-green-700">{fmt(d.paidAmount)} ₺</td>
                      <td className={`px-4 py-3 whitespace-nowrap font-semibold ${overdue ? "text-red-600" : remaining > 0 ? "text-orange-600" : "text-gray-400"}`}>
                        {fmt(remaining)} ₺
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {d.dueDate
                          ? <span className={overdue ? "text-red-600 font-medium" : "text-gray-600"}>
                              {new Date(d.dueDate).toLocaleDateString("tr-TR")}
                            </span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {d.status !== "ODENDI" && (
                            <button
                              onClick={() => { setSpForm({ amount: "", note: "" }); setModal({ type: "pay-supplier", debt: d }); }}
                              className="text-[11px] bg-[#2c1810] text-white px-2.5 py-1 hover:bg-[#3d2418] transition-colors"
                            >
                              Ödeme Yap
                            </button>
                          )}
                          <button
                            onClick={() => setModal({ type: "history-supplier", debt: d })}
                            className="text-[11px] border border-gray-200 px-2.5 py-1 hover:bg-gray-100 transition-colors"
                          >
                            Geçmiş
                          </button>
                          <button
                            onClick={() => { if (confirm("Silinsin mi?")) startT(() => deleteSupplierDebt(d.id)); }}
                            className="text-[11px] text-red-400 hover:text-red-600 px-1"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════ */}

      {/* Yeni Müşteri Alacağı */}
      {modal?.type === "new-customer" && (
        <Modal title="Yeni Müşteri Alacağı" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Müşteri *">
              <select value={cdForm.customerId} onChange={(e) => setCdForm((f) => ({ ...f, customerId: e.target.value }))} className={inputCls}>
                <option value="">Seçiniz...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>)}
              </select>
            </Field>
            <Field label="Sipariş (opsiyonel)">
              <select value={cdForm.orderId} onChange={(e) => setCdForm((f) => ({ ...f, orderId: e.target.value }))} className={inputCls}>
                <option value="">Sipariş seçme</option>
                {orders.map((o) => <option key={o.id} value={o.id}>#{o.orderNo}</option>)}
              </select>
            </Field>
            <Field label="Açıklama *">
              <input value={cdForm.description} onChange={(e) => setCdForm((f) => ({ ...f, description: e.target.value }))} placeholder="Sipariş #5 — kısmi ödeme" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Toplam Tutar (₺) *">
                <input type="number" min="0" value={cdForm.totalAmount} onChange={(e) => setCdForm((f) => ({ ...f, totalAmount: e.target.value }))} placeholder="0.00" className={inputCls} />
              </Field>
              <Field label="İlk Ödeme (₺)">
                <input type="number" min="0" value={cdForm.initialPayment} onChange={(e) => setCdForm((f) => ({ ...f, initialPayment: e.target.value }))} placeholder="0.00" className={inputCls} />
              </Field>
            </div>
            <Field label="Vade Tarihi">
              <input type="date" value={cdForm.dueDate} onChange={(e) => setCdForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(null)} className="text-sm text-gray-400 hover:text-gray-700 px-4 py-2">İptal</button>
              <button
                onClick={submitCdForm}
                disabled={!cdForm.customerId || !cdForm.description || !cdForm.totalAmount || isPending}
                className="bg-[#2c1810] text-white text-sm px-6 py-2 hover:bg-[#3d2418] disabled:opacity-40 transition-colors"
              >
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Müşteriden Ödeme Al */}
      {modal?.type === "pay-customer" && (
        <Modal title={`Ödeme Al — ${modal.debt.customer.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded text-sm space-y-1">
              <p className="text-gray-500">{modal.debt.description}</p>
              <p>Toplam: <span className="font-medium">{fmt(modal.debt.totalAmount)} ₺</span></p>
              <p>Ödenen: <span className="font-medium text-green-700">{fmt(modal.debt.paidAmount)} ₺</span></p>
              <p>Kalan: <span className="font-semibold text-orange-600">{fmt(modal.debt.totalAmount - modal.debt.paidAmount)} ₺</span></p>
            </div>
            <Field label="Bu Seferki Ödeme (₺) *">
              <input type="number" min="0.01" value={cpForm.amount} onChange={(e) => setCpForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className={inputCls} autoFocus />
            </Field>
            <Field label="Not (nakit / havale / EFT)">
              <input value={cpForm.note} onChange={(e) => setCpForm((f) => ({ ...f, note: e.target.value }))} placeholder="nakit ödeme" className={inputCls} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(null)} className="text-sm text-gray-400 hover:text-gray-700 px-4 py-2">İptal</button>
              <button
                onClick={() => submitCpForm(modal.debt.id)}
                disabled={!cpForm.amount || isPending}
                className="bg-green-600 text-white text-sm px-6 py-2 hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                {isPending ? "Kaydediliyor..." : "Ödeme Kaydet"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Yeni Tedarikçi Borcu */}
      {modal?.type === "new-supplier" && (
        <Modal title="Yeni Tedarikçi Borcu" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Tedarikçi Adı *">
              <div className="relative">
                <input
                  value={sdForm.supplierName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSdForm((f) => ({ ...f, supplierName: v }));
                    setSnSuggestions(v.length > 0 ? initSN.filter((n) => n.toLowerCase().includes(v.toLowerCase())) : []);
                  }}
                  onBlur={() => setTimeout(() => setSnSuggestions([]), 150)}
                  placeholder="Depo / tedarikçi adı"
                  className={inputCls + " w-full"}
                />
                {snSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 shadow-lg">
                    {snSuggestions.map((s) => (
                      <button key={s} onMouseDown={() => { setSdForm((f) => ({ ...f, supplierName: s })); setSnSuggestions([]); }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Açıklama *">
              <input value={sdForm.description} onChange={(e) => setSdForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ne aldık, hangi ürünler..." className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Toplam Borç (₺) *">
                <input type="number" min="0" value={sdForm.totalAmount} onChange={(e) => setSdForm((f) => ({ ...f, totalAmount: e.target.value }))} placeholder="0.00" className={inputCls} />
              </Field>
              <Field label="İlk Ödeme (₺)">
                <input type="number" min="0" value={sdForm.initialPayment} onChange={(e) => setSdForm((f) => ({ ...f, initialPayment: e.target.value }))} placeholder="0.00" className={inputCls} />
              </Field>
            </div>
            <Field label="Vade Tarihi">
              <input type="date" value={sdForm.dueDate} onChange={(e) => setSdForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(null)} className="text-sm text-gray-400 hover:text-gray-700 px-4 py-2">İptal</button>
              <button
                onClick={submitSdForm}
                disabled={!sdForm.supplierName || !sdForm.description || !sdForm.totalAmount || isPending}
                className="bg-[#2c1810] text-white text-sm px-6 py-2 hover:bg-[#3d2418] disabled:opacity-40 transition-colors"
              >
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Tedarikçiye Ödeme Yap */}
      {modal?.type === "pay-supplier" && (
        <Modal title={`Ödeme Yap — ${modal.debt.supplierName}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded text-sm space-y-1">
              <p className="text-gray-500">{modal.debt.description}</p>
              <p>Toplam: <span className="font-medium">{fmt(modal.debt.totalAmount)} ₺</span></p>
              <p>Ödenen: <span className="font-medium text-green-700">{fmt(modal.debt.paidAmount)} ₺</span></p>
              <p>Kalan: <span className="font-semibold text-red-600">{fmt(modal.debt.totalAmount - modal.debt.paidAmount)} ₺</span></p>
            </div>
            <Field label="Bu Seferki Ödeme (₺) *">
              <input type="number" min="0.01" value={spForm.amount} onChange={(e) => setSpForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className={inputCls} autoFocus />
            </Field>
            <Field label="Not">
              <input value={spForm.note} onChange={(e) => setSpForm((f) => ({ ...f, note: e.target.value }))} placeholder="havale, nakit..." className={inputCls} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(null)} className="text-sm text-gray-400 hover:text-gray-700 px-4 py-2">İptal</button>
              <button
                onClick={() => submitSpForm(modal.debt.id)}
                disabled={!spForm.amount || isPending}
                className="bg-[#2c1810] text-white text-sm px-6 py-2 hover:bg-[#3d2418] disabled:opacity-40 transition-colors"
              >
                {isPending ? "Kaydediliyor..." : "Ödeme Kaydet"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Ödeme geçmişi — müşteri */}
      {modal?.type === "history-customer" && (
        <PaymentHistory payments={modal.debt.payments} onClose={() => setModal(null)} />
      )}

      {/* Ödeme geçmişi — tedarikçi */}
      {modal?.type === "history-supplier" && (
        <PaymentHistory payments={modal.debt.payments} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
