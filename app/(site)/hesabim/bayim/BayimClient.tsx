"use client";

import { useState } from "react";

type Referral = {
  id: string;
  name: string | null;
  phone: string;
  createdAt: string;
  orderCount: number;
  orderTotal: number;
};

type ReferralOrder = {
  id: string;
  orderNo: string;
  createdAt: string;
  status: string;
  total: number;
  userName: string | null;
};

export default function BayimClient({
  referralCode,
  referralCount,
  referrals,
  referralOrders,
}: {
  referralCode: string;
  referralCount: number;
  referrals: Referral[];
  referralOrders: ReferralOrder[];
}) {
  const [tab, setTab] = useState<"link" | "musteriler" | "siparisler">("link");
  const [copied, setCopied] = useState(false);

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/kayit?ref=${referralCode}`;

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const STATUS_LABELS: Record<string, string> = {
    PENDING: "Beklemede", CONFIRMED: "Onaylandı", SHIPPED: "Kargoda",
    DELIVERED: "Teslim Edildi", CANCELLED: "İptal",
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-[#E8E4DE] mb-6">
        {([
          { key: "link",       label: "Referans Linkim" },
          { key: "musteriler", label: `Kayıt Olan Müşterilerim (${referralCount})` },
          { key: "siparisler", label: "Siparişleri" },
        ] as { key: "link" | "musteriler" | "siparisler"; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`font-sans text-[11px] tracking-[0.2em] uppercase px-4 py-3 border-b-2 transition-colors ${
              tab === key
                ? "border-[#C4A882] text-[#1A1A1A]"
                : "border-transparent text-[#9A9A9A] hover:text-[#1A1A1A]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Referans Linkim */}
      {tab === "link" && (
        <div className="space-y-6">
          <div className="bg-[#F7F4F0] border border-[#E8E4DE] p-5">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#9A9A9A] mb-3">Referans Kodunuz</p>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-2xl text-[#C4A882] font-bold tracking-widest">{referralCode}</span>
            </div>
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#9A9A9A] mb-2">Kayıt Linki</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-[#1A1A1A] bg-white border border-[#E8E4DE] px-3 py-2 truncate">
                /kayit?ref={referralCode}
              </code>
              <button
                onClick={copyLink}
                className="font-sans text-[10px] tracking-[0.2em] uppercase px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#C4A882] transition-colors shrink-0"
              >
                {copied ? "Kopyalandı ✓" : "Kopyala"}
              </button>
            </div>
          </div>
          <div className="text-center bg-white border border-[#E8E4DE] p-6">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#9A9A9A] mb-2">Bu Linki Paylaşanlar</p>
            <p className="font-serif text-4xl text-[#C4A882]">{referralCount}</p>
            <p className="font-sans text-xs text-[#9A9A9A] mt-1">kayıtlı müşteri</p>
          </div>
        </div>
      )}

      {/* Tab: Kayıt Olan Müşteriler */}
      {tab === "musteriler" && (
        <div>
          {referrals.length === 0 ? (
            <p className="text-center font-sans text-sm text-[#9A9A9A] py-10">
              Henüz linkinizden kayıt olan müşteri yok.
            </p>
          ) : (
            <div className="divide-y divide-[#E8E4DE]">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-[#1A1A1A]">{r.name ?? "—"}</p>
                    <p className="font-sans text-xs text-[#9A9A9A]">{r.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-sans text-xs text-[#6B6B6B]">{r.orderCount} sipariş</p>
                    <p className="font-sans text-xs text-[#9A9A9A]">
                      {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Siparişleri */}
      {tab === "siparisler" && (
        <div>
          {referralOrders.length === 0 ? (
            <p className="text-center font-sans text-sm text-[#9A9A9A] py-10">
              Müşterilerinizden henüz sipariş yok.
            </p>
          ) : (
            <div className="divide-y divide-[#E8E4DE]">
              {referralOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-xs font-medium text-[#1A1A1A]">#{o.orderNo.slice(-8)}</p>
                    <p className="font-sans text-[11px] text-[#9A9A9A]">{o.userName ?? "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-sans text-sm text-[#1A1A1A]">{Number(o.total).toLocaleString("tr-TR")} ₺</p>
                    <p className="font-sans text-[10px] text-[#9A9A9A]">
                      {STATUS_LABELS[o.status] ?? o.status} · {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
