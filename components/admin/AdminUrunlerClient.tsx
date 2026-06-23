"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleProductActive, deleteProduct } from "@/lib/actions/product";

type Category = { id: string; name: string; slug: string };
type Brand = { id: string; name: string; slug: string };
type Product = {
  id: string; name: string; slug: string; price: number | string;
  comparePrice?: number | string | null; costPrice?: number | string | null;
  stock: number; isActive: boolean;
  category?: Category | null;
  brand?: Brand | null;
};

export default function AdminUrunlerClient({ products, categories, brands }: { products: Product[]; categories: Category[]; brands: Brand[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("");
  const [marka, setMarka] = useState("");
  const [durum, setDurum] = useState("");

  const filtered = products.filter((p) => {
    const s = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const k = !kategori || p.category?.slug === kategori;
    const m = !marka || p.brand?.slug === marka;
    const d = durum === "" ? true : durum === "aktif" ? p.isActive : !p.isActive;
    return s && k && m && d;
  });

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => { await toggleProductActive(id, !current); router.refresh(); });
  }

  function handleDelete(id: string) {
    if (confirm("Bu urun silinsin mi?")) {
      startTransition(async () => { await deleteProduct(id); router.refresh(); });
    }
  }

  return (
    <>
      <div className="bg-white border border-[#e8ddd6] rounded-sm p-4 mb-6 flex flex-wrap gap-3">
        <input type="text" placeholder="Urun ara..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]" />
        <select value={kategori} onChange={(e) => setKategori(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tum Kategoriler</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={marka} onChange={(e) => setMarka(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tum Markalar</option>
          {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
        </select>
        <select value={durum} onChange={(e) => setDurum(e.target.value)}
          className="border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#5c4033] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]">
          <option value="">Tum Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="pasif">Pasif</option>
        </select>
        {(search || kategori || marka || durum) && (
          <button onClick={() => { setSearch(""); setKategori(""); setMarka(""); setDurum(""); }}
            className="text-xs text-[#8b6f5e] hover:text-[#2c1810] px-2">Temizle</button>
        )}
      </div>
      <p className="text-xs text-[#b8a89e] mb-4">{filtered.length} urun</p>
      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#b8a89e]">Urun bulunamadi.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
                {["Urun", "Marka", "Kategori", "Satis Fiyati", "Gelis Fiyati", "Stok", "Durum", ""].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr key={product.id} className={"border-b border-[#f0ebe6] hover:bg-[#faf8f6] transition-colors " + (i === filtered.length - 1 ? "border-b-0" : "")}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#2c1810]">{product.name}</p>
                    <p className="text-xs text-[#b8a89e] mt-0.5">/{product.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-[#5c4033] text-xs">{product.brand?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-[#5c4033]">{product.category?.name ?? "—"}</td>
                  <td className="px-6 py-4"><span className="text-[#2c1810] font-medium">{Number(product.price).toLocaleString("tr-TR")} TL</span></td>
                  <td className="px-6 py-4"><span className="text-[#8b6f5e] text-xs">{product.costPrice ? Number(product.costPrice).toLocaleString("tr-TR") + " TL" : "—"}</span></td>
                  <td className="px-6 py-4">
                    <span className={product.stock === 0 ? "text-red-600 font-medium" : product.stock <= 2 ? "text-orange-500 font-medium" : "text-[#5c4033]"}>
                      {product.stock}
                    </span>
                    {product.stock === 0 && (
                      <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Tükendi</span>
                    )}
                    {product.stock > 0 && product.stock <= 2 && (
                      <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">⚠ Düşük</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggle(product.id, product.isActive)}
                      className={"text-xs px-3 py-1 rounded-full transition-colors " + (product.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                      {product.isActive ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link href={"/admin/urunler/" + product.id + "/duzenle"} className="text-xs text-[#8b6f5e] hover:text-[#2c1810] transition-colors mr-4">Duzenle</Link>
                    <button onClick={() => handleDelete(product.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
