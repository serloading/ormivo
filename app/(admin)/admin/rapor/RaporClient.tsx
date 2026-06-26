"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface SoldItem {
  productId: string | null; name: string; qty: number;
  originalPrice: number; salePrice: number; costPrice: number;
  categoryId: string | null; categoryName: string | null;
  brandId: string | null; brandName: string | null;
  orderDate: string; source: "web" | "manuel";
  hasCargoFee: boolean;
  orderId: string;
}
interface TopCustomer { name: string; orderCount: number; totalSpend: number; }

interface Props {
  soldItems: SoldItem[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  topCustomers: TopCustomer[];
  cargoFee: number;
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
type CustomerSort = "orderCount" | "totalSpend";

export default function RaporClient({ soldItems, categories, brands, topCustomers, cargoFee }: Props) {
  const [monthFilter, setMonthFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [customerSort, setCustomerSort] = useState<CustomerSort>("orderCount");

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    soldItems.forEach((i) => {
      const dt = new Date(i.orderDate);
      set.add(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort().reverse();
  }, [soldItems]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [soldItems, monthFilter, categoryFilter, brandFilter]);

  // Finans özeti hesapla (sipariş bazlı, her sipariş için kargo bir kere sayılsın)
  const finans = useMemo(() => {
    // Kargo: aynı siparişten birden fazla item gelebilir — benzersiz (orderDate+source+hasCargoFee) mantığı
    // Sipariş bazlı kargo için sold items'ı siparişe grupla
    // Basit yaklaşım: hasCargoFee olan her item grubunu (orderDate+source) bir kere say
    const cargoOrders = new Set<string>();
    let originalTotal = 0;
    let saleTotal = 0;
    let costTotal = 0;
    let kargoGider = 0;

    // Filtrelenmemiş (kargo için tüm siparişler, sadece ay filtrelenir)
    const forCargo = soldItems.filter((i) => inMonth(i.orderDate));
    for (const item of forCargo) {
      if (item.hasCargoFee) {
        const key = item.orderId;
        if (!cargoOrders.has(key)) {
          cargoOrders.add(key);
          kargoGider += cargoFee;
        }
      }
    }

    // Finans: filtrelenmiş items üzerinden (kategori/marka filtresi varken bile)
    for (const item of filteredItems) {
      originalTotal += item.originalPrice;
      saleTotal += item.salePrice;
      costTotal += item.costPrice;
    }

    const indirim = originalTotal - saleTotal;
    const netKar = saleTotal - costTotal - kargoGider;

    return { originalTotal, indirim, saleTotal, costTotal, kargoGider, netKar };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems, soldItems, monthFilter, cargoFee]);

  const productTotals = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; categoryName: string | null; brandName: string | null }>();
    for (const item of filteredItems) {
      const key = item.productId ?? item.name;
      const ex = map.get(key);
      if (ex) { ex.qty += item.qty; }
      else map.set(key, { name: item.name, qty: item.qty, categoryName: item.categoryName, brandName: item.brandName });
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [filteredItems]);

  const sortedCustomers = useMemo(() =>
    [...topCustomers].sort((a, b) => customerSort === "orderCount" ? b.orderCount - a.orderCount : b.totalSpend - a.totalSpend),
    [topCustomers, customerSort]
  );

  const topProducts  = showAllProducts  ? productTotals   : productTotals.slice(0, 10);
  const visibleCusts = showAllCustomers ? sortedCustomers : sortedCustomers.slice(0, 10);

  const fmt = (n: number) => Math.round(n).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const monthLabel = monthFilter
    ? `${MONTHS[parseInt(monthFilter.split("-")[1]) - 1]} ${monthFilter.split("-")[0]}`
    : "Tüm Zamanlar";

  const summaryCards = [
    { label: "Orijinal Fiyat",    value: finans.originalTotal, sub: "İndirim öncesi toplam",  cls: "text-gray-700 bg-white border-gray-200" },
    { label: "İndirim",           value: -finans.indirim,       sub: "Uygulanan indirimler",   cls: "text-orange-700 bg-orange-50 border-orange-200" },
    { label: "Satış Tutarı",      value: finans.saleTotal,      sub: "Gerçek tahsilat",        cls: "text-green-700 bg-green-50 border-green-200" },
    { label: "Ürün Maliyeti",     value: -finans.costTotal,     sub: "Alış maliyeti toplamı",  cls: "text-red-700 bg-red-50 border-red-200" },
    { label: "Kargo Maliyeti",    value: -finans.kargoGider,    sub: `${finans.kargoGider / cargoFee | 0} kargo × ${cargoFee}₺`, cls: "text-red-700 bg-red-50 border-red-200" },
    { label: "Net Kâr",           value: finans.netKar,         sub: "Satış − Maliyet − Kargo", cls: finans.netKar >= 0 ? "text-green-800 bg-green-100 border-green-300" : "text-red-700 bg-red-50 border-red-200" },
  ];

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

      {/* Finans Özeti — 6 kart */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryCards.map((s) => (
          <div key={s.label} className={`border rounded-sm p-4 ${s.cls.split(" ").slice(1).join(" ")}`}>
            <p className="text-[10px] uppercase tracking-widest text-[#8b6f5e] mb-1">{s.label}</p>
            <p className={`text-xl font-light ${s.cls.split(" ")[0]}`}>
              {s.value < 0 ? "-" : ""}{fmt(Math.abs(s.value))} ₺
            </p>
            <p className="text-[10px] text-[#b8a89e] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* En Çok Satan Ürünler */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <Link href="/admin/urunler" className="text-base font-semibold text-[#2c1810] hover:text-[#8b6f5e] transition-colors">En Çok Satan Ürünler →</Link>
            <p className="text-xs text-[#8b6f5e] mt-0.5">{productTotals.length} farklı ürün · {filteredItems.reduce((s, i) => s + i.qty, 0)} adet satıldı</p>
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
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#f0ebe6] last:border-0 hover:bg-[#faf8f6]">
                    <td className="px-4 py-3 text-[#b8a89e] text-xs font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[#2c1810]">{item.name}</td>
                    <td className="px-4 py-3 text-[#8b6f5e] text-xs">{item.categoryName ?? "—"}</td>
                    <td className="px-4 py-3 text-[#8b6f5e] text-xs">{item.brandName ?? "—"}</td>
                    <td className="px-4 py-3 text-right"><span className="font-semibold text-indigo-600">{item.qty}</span><span className="text-[#b8a89e] text-xs ml-1">adet</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {productTotals.length > 10 && (
          <div className="mt-3 text-center">
            <button onClick={() => setShowAllProducts((v) => !v)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              {showAllProducts ? "Sadece İlk 10'u Göster" : `Tümünü Göster (${productTotals.length} ürün)`}
            </button>
          </div>
        )}
      </div>

      {/* En Çok Alışveriş Yapan Müşteriler */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <Link href="/admin/musteriler" className="text-base font-semibold text-[#2c1810] hover:text-[#8b6f5e] transition-colors">En Çok Alışveriş Yapan Müşteriler →</Link>
            <p className="text-xs text-[#8b6f5e] mt-0.5">Tüm zamanlar · <Link href="/admin/siparisler" className="hover:underline">Siparişlere git →</Link></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b6f5e]">Sırala:</span>
            {(["orderCount", "totalSpend"] as CustomerSort[]).map((v) => (
              <button key={v} onClick={() => setCustomerSort(v)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${customerSort === v ? "bg-[#2c1810] text-white border-[#2c1810]" : "border-[#d4c5ba] text-[#8b6f5e] hover:bg-[#f5f0eb]"}`}>
                {v === "orderCount" ? "Sipariş Sayısı" : "Toplam Harcama"}
              </button>
            ))}
          </div>
        </div>
        {sortedCustomers.length === 0 ? (
          <div className="py-16 text-center text-[#b8a89e] text-sm bg-white border border-[#e8ddd6] rounded-sm">Henüz müşteri verisi yok.</div>
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
                    <td className="px-4 py-3 text-right"><span className="font-semibold text-indigo-600">{c.orderCount}</span><span className="text-[#b8a89e] text-xs ml-1">sipariş</span></td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{fmt(c.totalSpend)} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {sortedCustomers.length > 10 && (
          <div className="mt-3 text-center">
            <button onClick={() => setShowAllCustomers((v) => !v)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              {showAllCustomers ? "Sadece İlk 10'u Göster" : `Tümünü Göster (${sortedCustomers.length} müşteri)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
