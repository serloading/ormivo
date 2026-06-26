"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  BRONZE_DISCOUNT: "30",
  SILVER_DISCOUNT: "40",
  GOLD_DISCOUNT:   "60",
};

export async function getSegmentSettings(): Promise<{ BRONZE: number; SILVER: number; GOLD: number }> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["BRONZE_DISCOUNT", "SILVER_DISCOUNT", "GOLD_DISCOUNT"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  return {
    BRONZE: parseFloat(map["BRONZE_DISCOUNT"] ?? DEFAULTS.BRONZE_DISCOUNT),
    SILVER: parseFloat(map["SILVER_DISCOUNT"] ?? DEFAULTS.SILVER_DISCOUNT),
    GOLD:   parseFloat(map["GOLD_DISCOUNT"]   ?? DEFAULTS.GOLD_DISCOUNT),
  };
}

export async function updateSegmentDiscount(segment: "BRONZE" | "SILVER" | "GOLD", percent: number) {
  const key = `${segment}_DISCOUNT`;
  await prisma.setting.upsert({
    where:  { key },
    update: { value: String(percent) },
    create: { key, value: String(percent) },
  });
  revalidatePath("/admin/kuponlar");
  revalidatePath("/");
  revalidatePath("/urunler");
  return { success: true };
}
