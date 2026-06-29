"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addAddress } from "@/lib/actions/address";

interface Props {
  defaultName:  string;
  defaultPhone: string;
  isFirst:      boolean;
}

export default function AdresEkleForm({ defaultName, defaultPhone, isFirst }: Props) {
  const [error, setError]          = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError("");
    startTransition(async () => {
      const result = await addAddress(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/hesabim");
        router.refresh();
      }
    });
  }

  const inp = "w-full border border-[#E8E4DE] px-3 py-2.5 font-sans text-sm text-[#1A1A1A] outline-none focus:border-[#C4A882] transition-colors";
  const lbl = "block font-sans text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1.5";

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/hesabim" className="text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="font-serif text-2xl text-[#1A1A1A]">Yeni Adres Ekle</h1>
        </div>

        <div className="bg-white border border-[#E8E4DE] p-6">
          {isFirst && (
            <p className="font-sans text-xs text-[#9A9A9A] bg-[#F7F4F0] border border-[#E8E4DE] px-3 py-2 mb-5">
              Bilgileriniz otomatik dolduruldu, gerekirse değiştirebilirsiniz.
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={lbl}>Alıcı Adı Soyadı *</label>
              <input name="recipientName" type="text" required placeholder="Ahmet Yılmaz"
                defaultValue={defaultName} className={inp} />
            </div>
            <div>
              <label className={lbl}>Alıcı Telefonu *</label>
              <input name="phone" type="tel" required placeholder="05XX XXX XX XX"
                defaultValue={defaultPhone} className={inp} />
            </div>
            <div>
              <label className={lbl}>Adres *</label>
              <input name="addressLine" type="text" required placeholder="Mahalle, cadde, no, daire" className={inp} />
            </div>
            <div>
              <label className={lbl}>Şehir *</label>
              <input name="city" type="text" required placeholder="İstanbul" className={inp} />
            </div>
            <div>
              <label className={lbl}>İlçe</label>
              <input name="district" type="text" placeholder="Kadıköy" className={inp} />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="isDefault" className="w-4 h-4 accent-[#C4A882]" />
              <span className="font-sans text-sm text-[#4A4A4A]">Varsayılan adres olarak kaydet</span>
            </label>

            {error && (
              <p className="font-sans text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={pending}
                className="flex-1 bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors disabled:opacity-60">
                {pending ? "Kaydediliyor…" : "Adresi Kaydet"}
              </button>
              <Link href="/hesabim"
                className="flex-1 text-center border border-[#E8E4DE] text-[#6B6B6B] font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
                İptal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
