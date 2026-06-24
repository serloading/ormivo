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

interface TopCustomer {
  name: string;
  orderCount: number;
  totalSpend: number;
}

interface Props {
  soldItems: SoldItem[];
  finance: FinanceRow[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  topCustomers: TopCustomer[];
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

type ProductSort = "qty" | "revenue";
type CustomerSort = "orderCount" | "totalSpend";

export default function RaporClient({ soldItems, finance, categories, brands, topCustomers }: Props) {
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [productSort, setProductSort] = useState<ProductSort>("qty");
  const [customerSort, setCustomerSort] = useState<CustomerSort>("orderCount");

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

  const filteredItems = useMemo(() => soldItems.filter((i) => {
    if (!inMonth(i.orderDate)) return false;
    if (categoryFilter && i.categoryId !== categoryFilter) return false;
    if (brandFilter && i.brandId !== brandFilter) return false;
    return true;
  }), [soldItems, monthFilter, categoryFilter, brandFilter]);

  const productTotals = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; categoryName: string | null; brandName: string | null }>();
    for (const item of filteredItems) {
      const key = item.productId ?? item.name;
      const ex = map.get(key);
      if (ex) { ex.qty += item.qty; ex.revenue += item.revenue; }
      else map.set(key, { name: item.name, qty: item.qty, revenue: item.revenue, categoryName: item.categoryName, brandName: item.brandName });
    }
    return Array.from(map.values()).sort((a, b) => productSort === "qty" ? b.qty - a.qty : b.revenue - a.revenue);
  }, [filteredItems, productSort]);

  const sortedCustomers = useMemo(() =>
    [...topCustomers].sort((a, b) => customerSort === "orderCount" ? b.orderCount - a.orderCount : b.totalSpend - a.totalSpend),
    [topCustomers, customerSort]
  );

  const topProducts  = showAllProducts  ? productTotals   : productTotals.slice(0, 10);
  const visibleCusts = showAllCustomers ? sortedCustomers : sortedCustomers.slice(0, 10);

  const filteredFinance = finance.filter((f) => inMonth(f.date));
  const gelir       = filteredFinance.filter((f) => f.type === "INCOME").reduce((s, f) => s + f.amount, 0);
  const kargoGider  = filteredFinance.filter((f) => f.category === "Kargo Gideri").reduce((s, f) => s + f.amount, 0);
  const urunGider   = filteredFinance.filter((f) => f.category === "Ürün Maliyeti").reduce((s, f) => s + f.amount, 0);
  const digerGider  = filteredFinance.filter((f) => f.type === "EXPENSE" && f.category !== "Kargo Gideri" && f.category !== "Ürün Maliyeti").reduce((s, f) => s + f.amount, 0);
  const kar = gelir - kargoGider - urunGider - digerGider;

  const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const monthLabel = monthFilter
    ? `${MONTHS[parseInt(monthFilter.split("-")[1]) - 1]} ${monthFilter.split("-")[0]}`
    : "Tüm Zamanlar";

  return (
    <div className="space-y-10 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-[#2c1810]">Rapor</h1>
          <p className="text-sm text-[#8b6f5e] mt-1">{monthLabel}</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white border border-[#e8ddd6] rounded-sm p-4 flex flex-wrap gap-3">
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tüm Zamanlar</option>
          {availableMonths.map((m) => {
            const [y, mo] = m.split("-");
            return <option key={m} value={m}>{MONTHS[parseInt(mo) - 1]} {y}</option>;
          })}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tüm Kategoriler</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tüm Markalar</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {(monthFilter || categoryFilter || brandFilter) && (
          <button onClick={() => { setMonthFilter(""); setCategoryFilter(""); setBrandFilter(""); }}
            className="text-xs text-[#8b6f5e] hover:text-[#2c1810] border border-[#d4c5ba] rounded-sm px-3 py-2">
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Finans Özeti */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Satış Geliri",       value: gelir,      cls: "bg-green-50 border-green-200 text-green-700" },
          { label: "Kargo Giderleri",    value: kargoGider, cls: "bg-orange-50 border-orange-200 text-orange-700" },
          { label: "Ürün Maliyetleri",   value: urunGider,  cls: "bg-orange-50 border-orange-200 text-orange-700" },
          { label: "Net Kâr",            value: kar,        cls: kar >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-sm p-5 ${s.cls}`}>
            <p className="text-[11px] uppercase tracking-widest text-[#8b6f5e] mb-2">{s.label}</p>
            <p className="text-2xl font-light">{fmt(s.value)} ₺</p>
          </div>
        ))}
      </div>
      {gelir === 0 && finance.length === 0 && (
        <p className="text-xs text-[#b8a89e] -mt-6">* Satış geliri verileri, siparişler "Ödeme Alındı" olarak işaretlendiğinde finansal kayıtlara geçer.</p>
      )}
      {digerGider > 0 && <p className="text-xs text-[#b8a89e]">* Diğer giderler ({fmt(digerGider)} ₺) net kâr hesabına dahildir.</p>}

      {/* En Çok Satan Ürünler */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#2c1810]">En Çok Satan Ürünler</h2>
            <p className="text-xs text-[#8b6f5e] mt-0.5">{productTotals.length} farklı ürün · {filteredItems.reduce((s, i) => s + i.qty, 0)} adet satıldı</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b6f5e]">Sırala:</span>
            <button onClick={() => setProductSort("qty")}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${productSort === "qty" ? "bg-[#2c1810] text-white border-[#2c1810]" : "border-[#d4c5ba] text-[#8b6f5e] hover:bg-[#f5f0eb]"}`}>
              Satış Adedi
            </button>
            <button onClick={() => setProductSort("revenue")}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${productSort === "revenue" ? "bg-[#2c1810] text-white border-[#2c1810]" : "border-[#d4c5ba] text-[#8b6f5e] hover:bg-[#f5f0eb]"}`}>
              Ciro
            </button>
          </div>
        </div>

        {productTotals.length === 0 ? (
          <div className="py-16 text-center text-[#b8a89e] text-sm bg-white border border-[#e8ddd6] rounded-sm">
            {monthFilter ? `${monthLabel} için satış verisi bulunamadı.` : "Henüz satış verisi yok."}
          </div>
        ) : (
          <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ddd6] bg-[#faf8f6] text-left text-xs text-[#8b6f5e] uppercase tracking-widest">
                  <th className="px-4 py-3 w-8">#</th>
                  <th className="px-4 py-3">Ürün</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Marka</th>
                  <th className="px-4 py-3 text-right">Satış Adedi</th>
                  <th className="px-4 py-3 text-right">Ciro</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#f0ebe6] last:border-0 hover:bg-[#faf8f6]">
                    <td className="px-4 py-3 text-[#b8a89e] text-xs font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[#2c1810]">{item.name}</td>
                    <td className="px-4 py-3 text-[#8b6f5e] text-xs">{item.categoryName ?? "—"}</td>
                    <td className="px-4 py-3 text-[#8b6f5e] text-xs">{item.brandName ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-indigo-600">{item.qty}</span>
                      <span className="text-[#b8a89e] text-xs ml-1">adet</span>
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
            <button onClick={() => setShowAllProducts((v) => !v)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              {showAllProducts ? "Sadece İlk 10'u Göster" : `Tümünü Göster (${productTotals.length} ürün)`}
            </button>
          </div>
        )}
      </div>

      {/* En Çok Alışveriş Yapan Müşteriler */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#2c1810]">En Çok Alışveriş Yapan Müşteriler</h2>
            <p className="text-xs text-[#8b6f5e] mt-0.5">Tüm zamanlar</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b6f5e]">Sırala:</span>
            <button onClick={() => setCustomerSort("orderCount")}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${customerSort === "orderCount" ? "bg-[#2c1810] text-white border-[#2c1810]" : "border-[#d4c5ba] text-[#8b6f5e] hover:bg-[#f5f0eb]"}`}>
              Sipariş Sayısı
            </button>
            <button onClick={() => setCustomerSort("totalSpend")}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${customerSort === "totalSpend" ? "bg-[#2c1810] text-white border-[#2c1810]" : "border-[#d4c5ba] text-[#8b6f5e] hover:bg-[#f5f0eb]"}`}>
              Toplam Harcama
            </button>
          </div>
        </div>

        {sortedCustomers.length === 0 ? (
          <div className="py-16 text-center text-[#b8a89e] text-sm bg-white border border-[#e8ddd6] rounded-sm">
            Henüz müşteri verisi yok.
          </div>
        ) : (
          <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ddd6] bg-[#faf8f6] text-left text-xs text-[#8b6f5e] uppercase tracking-widest">
                  <th className="px-4 py-3 w-8">#</th>
                  <th className="px-4 py-3">Müşteri</th>
                  <th className="px-4 py-3 text-right">Sipariş Sayısı</th>
                  <th className="px-4 py-3 text-right">Toplam Harcama</th>
                </tr>
              </thead>
              <tbody>
                {visibleCusts.map((c, idx) => (
                  <tr key={idx} className="border-b border-[#f0ebe6] last:border-0 hover:bg-[#faf8f6]">
                    <td className="px-4 py-3 text-[#b8a89e] text-xs font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[#2c1810]">{c.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-indigo-600">{c.orderCount}</span>
                      <span className="text-[#b8a89e] text-xs ml-1">sipariş</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{fmt(c.totalSpend)} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sortedCustomers.length > 10 && (
          <div className="mt-3 text-center">
            <button onClick={() => setShowAllCustomers((v) => !v)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              {showAllCustomers ? "Sadece İlk 10'u Göster" : `Tümünü Göster (${sortedCustomers.length} müşteri)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
