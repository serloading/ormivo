"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  BRONZE_DISCOUNT: "30",
  SILVER_DISCOUNT: "40",
  GOLD_DISCOUNT: "60",
  DIAMOND_MARKUP: "500",
};

export async function getSegmentSettings(): Promise<{ BRONZE: number; SILVER: number; GOLD: number; DIAMOND: number }> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["BRONZE_DISCOUNT", "SILVER_DISCOUNT", "GOLD_DISCOUNT", "DIAMOND_MARKUP"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  return {
    BRONZE: parseFloat(map["BRONZE_DISCOUNT"] ?? DEFAULTS.BRONZE_DISCOUNT),
    SILVER: parseFloat(map["SILVER_DISCOUNT"] ?? DEFAULTS.SILVER_DISCOUNT),
    GOLD: parseFloat(map["GOLD_DISCOUNT"] ?? DEFAULTS.GOLD_DISCOUNT),
    DIAMOND: parseFloat(map["DIAMOND_MARKUP"] ?? DEFAULTS.DIAMOND_MARKUP),
  };
}

export async function updateSegmentDiscount(segment: "BRONZE" | "SILVER" | "GOLD", percent: number) {
  const key = `${segment}_DISCOUNT`;
  await prisma.setting.upsert({
    where: { key },
    update: { value: String(percent) },
    create: { key, value: String(percent) },
  });
  revalidatePath("/admin/kuponlar");
  revalidatePath("/");
  revalidatePath("/urunler");
  return { success: true };
}

export async function updateDiamondMarkup(amount: number) {
  await prisma.setting.upsert({
    where: { key: "DIAMOND_MARKUP" },
    update: { value: String(amount) },
    create: { key: "DIAMOND_MARKUP", value: String(amount) },
  });
  revalidatePath("/admin/kuponlar");
  revalidatePath("/");
  revalidatePath("/urunler");
  return { success: true };
}

export async function getTransferInfo(): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: "TRANSFER_INFO" } });
  return row?.value ?? "";
}

export async function updateTransferInfo(info: string) {
  await prisma.setting.upsert({
    where:  { key: "TRANSFER_INFO" },
    update: { value: info },
    create: { key: "TRANSFER_INFO", value: info },
  });
  revalidatePath("/admin/ayarlar");
  return { success: true };
}

export async function getUsdRate(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "usd_rate" } });
  return row ? parseFloat(row.value) : 38;
}

export async function setUsdRate(rate: number) {
  await prisma.setting.upsert({
    where:  { key: "usd_rate" },
    update: { value: String(rate) },
    create: { key: "usd_rate", value: String(rate) },
  });
  revalidatePath("/admin/urunler");
  return { success: true };
}
