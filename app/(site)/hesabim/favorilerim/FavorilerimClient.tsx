"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link  from "next/link";
import { createFavoriteList, deleteFavoriteList } from "@/lib/actions/favoriteList";
import FavoriteButton from "@/components/site/FavoriteButton";
import { calcDisplayPrice, type SegmentPricingSettings } from "@/lib/segment";

interface FavProduct {
  id: string; name: string; slug: string;
  images: string[]; price: number; costPrice?: number | null; brandName: string | null; categoryName?: string | null;
}
interface FavList {
  id: string; name: string; productIds: string[]; createdAt: string;
  products: Omit<FavProduct, "categoryName">[];
}

export default function FavorilerimClient({
  favorites, lists, isB2B = false, b2bMarkup = null, userSegment = null, segmentSettings,
}: { favorites: FavProduct[]; lists: FavList[]; isB2B?: boolean; b2bMarkup?: number | null; userSegment?: string | null; segmentSettings?: SegmentPricingSettings }) {
  const [showModal, setShowModal]     = useState(false);
  const [listName, setListName]       = useState("");
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [localLists, setLocalLists]   = useState(lists);
  const [isPending, startTransition]  = useTransition();
  const [error, setError]             = useState("");

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openModal() {
    setSelected(new Set(favorites.map((f) => f.id)));
    setListName("");
    setError("");
    setShowModal(true);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!listName.trim()) { setError("Liste adı boş olamaz"); return; }
    if (selected.size === 0) { setError("En az bir ürün seçin"); return; }
    startTransition(async () => {
      const res = await createFavoriteList(listName, [...selected]);
      if (res.error) { setError(res.error); return; }
      // optimistic add
      setLocalLists((prev) => [{
        id: Math.random().toString(),
        name: listName.trim(),
        productIds: [...selected],
        createdAt: new Date().toISOString(),
        products: favorites.filter((f) => selected.has(f.id)),
      }, ...prev]);
      setShowModal(false);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Bu listeyi silmek istediğinizden emin misiniz?")) return;
    startTransition(async () => {
      await deleteFavoriteList(id);
      setLocalLists((prev) => prev.filter((l) => l.id !== id));
    });
  }

  return (
    <div className="space-y-10">

      {/* Kayıtlı Listeler */}
      {localLists.length > 0 && (
        <section>
          <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882] mb-4">Kayıtlı Listelerim</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {localLists.map((list) => (
              <div key={list.id} className="bg-white border border-[#E8E4DE] p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-serif text-base text-[#1A1A1A]">{list.name}</h3>
                    <p className="font-sans text-[10px] text-[#9A9A9A] mt-0.5">
                      {list.products.length} ürün · {new Date(list.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(list.id)}
                    className="font-sans text-[10px] text-red-400 hover:text-red-600 transition-colors shrink-0">
                    Sil
                  </button>
                </div>
                {/* Preview: first 4 products */}
                <div className="flex gap-1.5">
                  {list.products.slice(0, 4).map((p) => (
                    <Link key={p.id} href={`/urunler/${p.slug}`}
                      className="relative w-14 h-14 bg-[#F7F4F0] border border-[#E8E4DE] shrink-0 overflow-hidden hover:border-[#C4A882] transition-colors">
                      {p.images[0] ? (
                        <Image src={p.images[0]} alt={p.name} fill className="object-contain p-1" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[#C4A882] text-lg opacity-30">◈</span>
                      )}
                    </Link>
                  ))}
                  {list.products.length > 4 && (
                    <div className="w-14 h-14 bg-[#F7F4F0] border border-[#E8E4DE] flex items-center justify-center">
                      <span className="font-sans text-xs text-[#9A9A9A]">+{list.products.length - 4}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tüm Favoriler */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882]">
            Tüm Favorilerim {favorites.length > 0 && `(${favorites.length})`}
          </h2>
          {favorites.length > 0 && (
            <button onClick={openModal}
              className="font-sans text-[10px] tracking-[0.15em] uppercase bg-[#1A1A1A] text-white px-3 py-1.5 hover:bg-[#C4A882] transition-colors">
              + Listeye Kaydet
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white border border-[#E8E4DE] py-16 text-center">
            <p className="font-serif text-2xl text-[#C4A882] mb-3">♡</p>
            <p className="font-sans text-sm text-[#9A9A9A]">Henüz favoriye ürün eklemediniz.</p>
            <Link href="/urunler" className="inline-block mt-4 font-sans text-[10px] tracking-[0.2em] uppercase border border-[#E8E4DE] px-4 py-2 hover:border-[#1A1A1A] transition-colors">
              Ürünleri Keşfet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {favorites.map((p) => (
              <article key={p.id} className="group bg-white border border-[#E8E4DE] hover:border-[#C4A882] hover:shadow-sm transition-all duration-200 flex flex-col">
                <div className="relative overflow-hidden bg-[#F7F4F0]" style={{ aspectRatio: "3/4" }}>
                  <Link href={`/urunler/${p.slug}`} className="absolute inset-0" aria-label={p.name} />
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill sizes="(max-width:640px) 50vw, 20vw"
                      className="object-contain p-3 group-hover:scale-[1.03] transition-transform duration-300 pointer-events-none" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center font-serif text-3xl text-[#C4A882] opacity-20 pointer-events-none">◈</span>
                  )}
                  <FavoriteButton productId={p.id} loggedIn={true} initialFavorited={true} />
                </div>
                <div className="p-2 flex flex-col flex-1">
                  {p.brandName && <p className="font-sans text-[7px] tracking-[0.2em] text-[#C4A882] mb-0.5">{p.brandName}</p>}
                  <Link href={`/urunler/${p.slug}`}>
                    <h3 className="font-sans text-[11px] leading-snug text-[#1A1A1A] hover:text-[#C4A882] transition-colors line-clamp-2 mb-1">{p.name}</h3>
                  </Link>
                  {(() => {
                    const { displayPrice, originalPrice, label, labelColor } = calcDisplayPrice(p.price, p.costPrice, isB2B, b2bMarkup, userSegment, segmentSettings);
                    return label ? (
                      <div className="mt-auto space-y-0.5">
                        <span className={`font-sans text-[8px] px-1 py-px rounded font-semibold ${labelColor}`}>{label}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-sans text-xs font-semibold text-[#C4A882]">{displayPrice.toLocaleString("tr-TR")} ₺</span>
                          {originalPrice && <span className="font-sans text-[10px] text-[#9A9A9A] line-through">{originalPrice.toLocaleString("tr-TR")} ₺</span>}
                        </div>
                      </div>
                    ) : (
                      <p className="font-sans text-xs font-semibold text-[#1A1A1A] mt-auto">
                        {displayPrice.toLocaleString("tr-TR")} ₺
                      </p>
                    );
                  })()}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Liste oluşturma modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-md max-h-[85vh] flex flex-col shadow-xl">
            <div className="px-6 py-5 border-b border-[#E8E4DE]">
              <h3 className="font-serif text-lg text-[#1A1A1A]">Yeni Liste Oluştur</h3>
              <p className="font-sans text-xs text-[#9A9A9A] mt-1">Favorilerinden seçip bir isim ver</p>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E8E4DE]">
                <label className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] block mb-2">Liste Adı</label>
                <input
                  autoFocus
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="ör. Doğum Günü Listesi"
                  className="w-full border border-[#E8E4DE] focus:border-[#C4A882] outline-none px-3 py-2 font-sans text-sm text-[#1A1A1A]"
                />
              </div>

              {/* Ürün seçimi */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A]">
                    Ürünler ({selected.size}/{favorites.length})
                  </p>
                  <button type="button"
                    onClick={() => setSelected(selected.size === favorites.length ? new Set() : new Set(favorites.map((f) => f.id)))}
                    className="font-sans text-[10px] text-[#C4A882] hover:underline">
                    {selected.size === favorites.length ? "Tümünü kaldır" : "Tümünü seç"}
                  </button>
                </div>
                <div className="space-y-2">
                  {favorites.map((p) => (
                    <label key={p.id} className={`flex items-center gap-3 p-2 cursor-pointer border transition-colors ${selected.has(p.id) ? "border-[#C4A882] bg-[#FFF9F4]" : "border-[#E8E4DE] hover:border-[#C4A882]"}`}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-[#C4A882] w-4 h-4 shrink-0" />
                      {p.images[0] ? (
                        <div className="relative w-10 h-10 shrink-0 bg-[#F7F4F0]">
                          <Image src={p.images[0]} alt={p.name} fill className="object-contain p-0.5" />
                        </div>
                      ) : <div className="w-10 h-10 shrink-0 bg-[#F7F4F0]" />}
                      <div className="min-w-0">
                        <p className="font-sans text-xs text-[#1A1A1A] line-clamp-1">{p.name}</p>
                        <p className="font-sans text-[10px] text-[#9A9A9A]">{p.price.toLocaleString("tr-TR")} ₺</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="px-6 text-xs text-red-500 mb-2">{error}</p>}

              <div className="px-6 py-4 border-t border-[#E8E4DE] flex gap-3">
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-[#1A1A1A] text-white font-sans text-[10px] tracking-[0.2em] uppercase py-2.5 hover:bg-[#C4A882] transition-colors disabled:opacity-50">
                  {isPending ? "Kaydediliyor…" : "Kaydet"}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 border border-[#E8E4DE] font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] hover:border-[#1A1A1A] transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
