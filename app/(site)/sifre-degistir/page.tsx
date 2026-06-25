"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/lib/actions/auth";

export default function SifreDegistirPage() {
  const [error, setError]          = useState("");
  const [success, setSuccess]      = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await changePassword(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => { window.location.href = "/"; }, 1500);
      }
    });
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#FAFAF7]">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#E8E4DE] p-8">
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl text-[#1A1A1A] mb-1">Şifrenizi Belirleyin</h1>
            <p className="font-sans text-xs text-[#9A9A9A]">Güvenliğiniz için lütfen yeni bir şifre oluşturun</p>
          </div>

          {success ? (
            <div className="text-center py-6">
              <p className="font-sans text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3">
                Şifreniz güncellendi. Yönlendiriliyorsunuz...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-sans text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1.5">
                  Yeni Şifre
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="En az 8 karakter"
                  autoComplete="new-password"
                  className="w-full border border-[#E8E4DE] px-3 py-2.5 font-sans text-sm outline-none focus:border-[#C4A882] transition-colors"
                />
              </div>

              <div>
                <label className="block font-sans text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1.5">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Şifrenizi tekrar girin"
                  autoComplete="new-password"
                  className="w-full border border-[#E8E4DE] px-3 py-2.5 font-sans text-sm outline-none focus:border-[#C4A882] transition-colors"
                />
              </div>

              {error && (
                <p className="font-sans text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full bg-[#1A1A1A] text-white font-sans text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#C4A882] transition-colors disabled:opacity-50"
              >
                {pending ? "Kaydediliyor..." : "Şifremi Kaydet"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
