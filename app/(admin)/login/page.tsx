"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-posta veya şifre hatalı.");
    } else {
      router.push("/admin/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light tracking-[0.3em] text-[#2c1810] uppercase">
            Ormivo
          </h1>
          <p className="mt-2 text-sm tracking-widest text-[#8b6f5e] uppercase">
            Admin Paneli
          </p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-sm border border-[#e8ddd6] rounded-sm p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium tracking-widest text-[#5c4033] uppercase mb-2"
              >
                E-posta
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#d4c5ba] rounded-sm px-4 py-3 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] transition-colors bg-[#faf8f6]"
                placeholder="admin@ormivo.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium tracking-widest text-[#5c4033] uppercase mb-2"
              >
                Şifre
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#d4c5ba] rounded-sm px-4 py-3 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] transition-colors bg-[#faf8f6]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2c1810] text-[#f5f0eb] py-3 px-6 text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#3d2418] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-[#b8a89e]">
          © {new Date().getFullYear()} Ormivo. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
