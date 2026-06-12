"use server";

// import { prisma } from "@/lib/prisma";
// import { revalidatePath } from "next/cache";

export type FinanceFormData = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category?: string;
  date?: Date;
};

export async function createFinanceRecord(data: FinanceFormData) {
  // await prisma.finance.create({ data });
  // revalidatePath("/admin/finans");

  console.log("createFinanceRecord (mock):", data);
  return { success: true };
}
