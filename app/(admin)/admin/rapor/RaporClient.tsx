"use client";

import { useState, useMemo } from "react";

interface SoldItem {
  productId: string | null;
  name: string;
  qty: number;
  revenue: number;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  orderDate: string;
  source: "web" | "manuel";
}

interface FinanceRow {
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string | null;
  date: string;
}

interface Props {
  soldItems: SoldItem[];
  finance: FinanceRow[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export default function RaporClient({ soldItems, finance, categories, brands }: Props) {
  const now = new Date();
  const [monthFilter, setMonthFilter] = useState<string>(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Available months from data
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    [...soldItems.map((i) => i.orderDate), ...finance.map((f) => f.date)].forEach((d) => {
      const dt = new Date(d);
      set.add(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort().reverse();
  }, [soldItems, finance]);

  function inMonth(dateStr: string) {
    if (!monthFilter) return true;
    const dt = new Date(dateStr);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}` === monthFilter;
  }

  // Filter sold items
  const filteredItems = useMemo(() => soldItems.filter((i) => {
    if (!inMonth(i.orderDate)) return false;
    if (categoryFilter && i.categoryId !== categoryFilter) return false;
    if (brandFilter && i.brandId !== brandFilter) return false;
    return true;
  }), [soldItems, monthFilter, categoryFilter, brandFilter]);

  // Aggregate by product
  const productTotals = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; categoryName: string | null; brandName: string | null }>();
    for (const item of filteredItems) {
      const key = item.productId ?? item.name;
      const existing = map.get(key);
      if (existing) {
        existing.qty += item.qty;
        existing.revenue += item.revenue;
      } else {
        map.set(key, { name: item.name, qty: item.qty, revenue: item.revenue, categoryName: item.categoryName, brandName: item.brandName });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [filteredItems]);

  const top = showAll ? productTotals : productTotals.slice(0, 10);

  // Finance summary for selected month
  const filteredFinance = finance.filter((f) => inMonth(f.date));
  const gelir      = filteredFinance.filter((f) => f.type === "INCOME").reduce((s, f) => s + f.amount, 0);
  const kargoGider = filteredFinance.filter((f) => f.category === "Kargo Gideri").reduce((s, f) => s + f.amount, 0);
  const urunGider  = filteredFinance.filter((f) => f.category === "Ürün Maliyeti").reduce((s, f) => s + f.amount, 0);
  const digerGider = filteredFinance.filter((f) => f.type === "EXPENSE" && f.category !== "Kargo Gideri" && f.category !== "Ürün Maliyeti").reduce((s, f) => s + f.amount, 0);
  const toplamGider = kargoGider + urunGider + digerGider;
  const kar = gelir - toplamGider;

  const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const monthLabel = (() => {
    if (!monthFilter) return "Tüm Zamanlar";
    const [y, m] = monthFilter.split("-");
    return `${MONTHS[parseInt(m) - 1]} ${y}`;
  })();

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Rapor</h1>
        <span className="text-sm text-gray-400">{monthLabel}</span>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
          <option value="">Tüm Zamanlar</option>
          {availableMonths.map((m) => {
            const [y, mo] = m.split("-");
            return <option key={m} value={m}>{MONTHS[parseInt(mo) - 1]} {y}</option>;
          })}
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
          <option value="">Tüm Kategoriler</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
          <option value="">Tüm Markalar</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {(categoryFilter || brandFilter) && (
          <button onClick={() => { setCategoryFilter(""); setBrandFilter(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-3 py-2">
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Finans Özeti */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Toplam Satış Geliri",  value: gelir,      color: "text-green-700",  bg: "bg-green-50 border-green-200" },
          { label: "Kargo Giderleri",      value: kargoGider, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
          { label: "Ürün Maliyetleri",     value: urunGider,  color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
          { label: "Net Kâr",              value: kar,        color: kar >= 0 ? "text-green-700" : "text-red-600", bg: kar >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-lg p-4 ${s.bg}`}>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-light ${s.color}`}>{fmt(s.value)} ₺</p>
          </div>
        ))}
      </div>

      {digerGider > 0 && (
        <p className="text-xs text-gray-400">* Diğer giderler ({fmt(digerGider)} ₺) net kâr hesabına dahildir.</p>
      )}

      {/* En Çok Satılan Ürünler */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">
            {showAll ? "Tüm Satılan Ürünler" : "En Çok Satan 10 Ürün"}
          </h2>
          <span className="text-sm text-gray-400">{productTotals.length} farklı ürün</span>
        </div>

        {top.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm bg-white border border-gray-100 rounded-lg">
            {monthFilter ? "Bu ay için veri bulunamadı." : "Satış verisi bulunamadı."}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 w-8">#</th>
                  <th className="px-4 py-3">Ürün</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Marka</th>
                  <th className="px-4 py-3 text-right">Satış Adedi</th>
                  <th className="px-4 py-3 text-right">Ciro</th>
                </tr>
              </thead>
              <tbody>
                {top.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.categoryName ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.brandName ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-indigo-600">{item.qty}</span>
                      <span className="text-gray-400 text-xs ml-1">adet</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{fmt(item.revenue)} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {productTotals.length > 10 && (
          <div className="mt-3 text-center">
            <button onClick={() => setShowAll((v) => !v)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              {showAll ? "Sadece İlk 10'u Göster" : `Tümünü Göster (${productTotals.length} ürün)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
