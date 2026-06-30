"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function approveB2B(userId: string) {
  await prisma.siteUser.update({
    where: { id: userId },
    data: { isB2BApproved: true },
  });
  revalidatePath("/admin/bayiler");
}

export async function rejectB2B(userId: string) {
  await prisma.siteUser.update({
    where: { id: userId },
    data: { isB2B: false, isB2BApproved: false },
  });
  revalidatePath("/admin/bayiler");
}

export async function revokeB2B(userId: string) {
  await prisma.siteUser.update({
    where: { id: userId },
    data: { isB2BApproved: false },
  });
  revalidatePath("/admin/bayiler");
}
