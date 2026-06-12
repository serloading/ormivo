"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type CargoFormData = {
  orderId: string;
  customerId: string;
  company?: string;
  trackingNo?: string;
  status?: "PREPARING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "RETURNED";
  notes?: string;
};

export async function getCargos() {
  return prisma.cargoTracking.findMany({
    include: { order: true, customer: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createCargo(data: CargoFormData) {
  await prisma.cargoTracking.create({ data });
  revalidatePath("/admin/kargo");
  return { success: true };
}

export async function updateCargo(id: string, data: Partial<CargoFormData>) {
  await prisma.cargoTracking.update({ where: { id }, data });
  revalidatePath("/admin/kargo");
  return { success: true };
}

export async function deleteCargo(id: string) {
  await prisma.cargoTracking.delete({ where: { id } });
  revalidatePath("/admin/kargo");
  return { success: true };
}
