"use client";

import { useState } from "react";

interface ReferralUser {
  id: string;
  name: string | null;
  phone: string;
  createdAt: string;
  orderCount: number;
}

interface Props {
  referralCode: string;
  referrals: ReferralUser[];
  totalRefOrders: number;
  earnedRewards: number;
  progressToNext: number; // 0-9
}

function maskName(name: string | null, phone: string): string {
  if (name && name.trim().length > 1) {
    const parts = name.trim().split(" ");
    return parts.map((p) => p[0] + "*".repeat(Math.max(1, p.length - 1))).join(" ");
  }
  const digits = phone.replace(/\D/g, "");
  return digits.slice(0, 4) + "***" + digits.slice(-2);
}

export default function HesabimReferral({
  referralCode,
  referrals,
  totalRefOrders,
  earnedRewards,
  progressToNext,
}: Props) {
  const [copied, setCopied] = useState(false);

  const refLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/kayit?ref=${referralCode}`
      : `/kayit?ref=${referralCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const pct = Math.round((progressToNext / 10) * 100);

  return (
    <div className="bg-white border border-[#E8E4DE] p-5 space-y-5">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882]">
          Arkadaşını Davet Et
        </h2>
        {earnedRewards > 0 && (
          <span className="font-sans text-[9px] bg-green-100 text-green-700 px-2 py-0.5 font-semibold tracking-wide">
            {earnedRewards} Hediye Hakkı
          </span>
        )}
      </div>

      {/* Ref link kutusu */}
      <div>
        <p className="font-sans text-[10px] text-[#9A9A9A] mb-2 tracking-wide">
          Arkadaşların bu link ile kayıt olursa, verdikleri her 10 sipariş için sana 1 parfüm hediye ederiz.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 bg-[#FAFAF7] border border-[#E8E4DE] px-3 py-2 font-mono text-[10px] text-[#6B6B6B] truncate select-all">
            {typeof window !== "undefined"
              ? `${window.location.origin}/kayit?ref=${referralCode}`
              : `/kayit?ref=${referralCode}`}
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 bg-[#1A1A1A] text-white font-sans text-[10px] tracking-[0.2em] uppercase px-4 py-2 hover:bg-[#C4A882] transition-colors"
          >
            {copied ? "✓ Kopyalandı" : "Kopyala"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between font-sans text-[10px] text-[#9A9A9A] mb-1.5">
          <span>
            {totalRefOrders > 0
              ? `${totalRefOrders} toplam sipariş`
              : "Henüz sipariş yok"}
          </span>
          <span className="text-[#C4A882] font-medium">
            Sonraki hediye için {10 - progressToNext} sipariş kaldı
          </span>
        </div>
        <div className="h-2 bg-[#F0EBE5] rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full bg-[#C4A882] transition-all duration-700"
            style={{ width: progressToNext === 0 && totalRefOrders === 0 ? "0%" : `${pct === 0 ? 2 : pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-sans text-[9px] text-[#9A9A9A]">0</span>
          <span className="font-sans text-[9px] text-[#9A9A9A]">10 sipariş = 1 hediye parfüm</span>
        </div>
      </div>

      {/* Davet ettikleri listesi */}
      {referrals.length > 0 ? (
        <div>
          <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] mb-3">
            {referrals.length} kişi davet ettin
          </p>
          <div className="space-y-2">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between border border-[#E8E4DE] px-3 py-2"
              >
                <div>
                  <p className="font-sans text-xs text-[#1A1A1A] font-medium">
                    {maskName(r.name, r.phone)}
                  </p>
                  <p className="font-sans text-[10px] text-[#9A9A9A]">
                    {new Date(r.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-xs font-semibold text-[#1A1A1A]">
                    {r.orderCount} sipariş
                  </p>
                  {r.orderCount === 0 && (
                    <p className="font-sans text-[9px] text-[#9A9A9A]">Henüz sipariş vermedi</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="font-sans text-xs text-[#9A9A9A] text-center py-2">
          Henüz kimseyi davet etmedin. Linkini paylaş, birlikte kazanın.
        </p>
      )}
    </div>
  );
}
