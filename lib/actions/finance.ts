"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type FinanceFormData = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category?: string;
  date?: Date;
};

export async function getFinanceRecords() {
  return prisma.finance.findMany({ orderBy: { date: "desc" } });
}

export async function createFinanceRecord(data: FinanceFormData) {
  await prisma.finance.create({ data });
  revalidatePath("/admin/finans");
  return { success: true };
}

export async function deleteFinanceRecord(id: string) {
  await prisma.finance.delete({ where: { id } });
  revalidatePath("/admin/finans");
  return { success: true };
}
