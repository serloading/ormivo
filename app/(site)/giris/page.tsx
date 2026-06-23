"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/actions/auth";

export default function GirisPage() {
  const router = useRouter();
  const [error, setError]       = useState("");
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await login(fd);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[#FAFAF7]">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#E8E4DE] p-8">
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl text-[#1A1A1A] mb-1">Giriş Yap</h1>
            <p className="font-sans text-xs text-[#9A9A9A]">Hesabınıza erişin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-sans text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1.5">
                E-posta
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border border-[#E8E4DE] px-3 py-2.5 font-sans text-sm text-[#1A1A1A] outline-none focus:border-[#C4A882] transition-colors"
              />
            </div>

            <div>
              <label className="block font-sans text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1.5">
                Şifre
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full border border-[#E8E4DE] px-3 py-2.5 font-sans text-sm text-[#1A1A1A] outline-none focus:border-[#C4A882] transition-colors"
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
              {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p className="font-sans text-xs text-center text-[#9A9A9A] mt-6">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="text-[#C4A882] hover:underline">
              Kayıt olun
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
