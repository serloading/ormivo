import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary — Supabase sonrası eklenecek
      // { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // Supabase bağlanana kadar static export devre dışı
};

export default nextConfig;
