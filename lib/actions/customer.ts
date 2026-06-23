"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/actions/activity-log";
import { auth } from "@/lib/auth";

export type CustomerFormData = {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  note?: string;
};

export const SEGMENTS = ["VIP", "REGULAR", "NEW", "AT_RISK", "LOST"] as const;
export type Segment = (typeof SEGMENTS)[number];

export const SEGMENT_LABELS: Record<string, string> = {
  VIP:      "VIP",
  REGULAR:  "Regular",
  NEW:      "Yeni",
  AT_RISK:  "Kaybedilmek Üzere",
  LOST:     "Kayıp",
};

export const SEGMENT_COLORS: Record<string, string> = {
  VIP:     "bg-yellow-100 text-yellow-800 border-yellow-300",
  REGULAR: "bg-gray-100 text-gray-600 border-gray-300",
  NEW:     "bg-blue-100 text-blue-700 border-blue-300",
  AT_RISK: "bg-orange-100 text-orange-700 border-orange-300",
  LOST:    "bg-red-100 text-red-600 border-red-300",
};

export async function getCustomers() {
  return prisma.customer.findMany({
    include: {
      _count: { select: { orders: true, siteOrders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      notes:  { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" } },
      siteOrders: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createCustomer(data: CustomerFormData) {
  await prisma.customer.create({ data });
  revalidatePath("/admin/musteriler");
  return { success: true };
}

export async function updateCustomer(id: string, data: Partial<CustomerFormData>) {
  await prisma.customer.update({ where: { id }, data });
  revalidatePath("/admin/musteriler");
  revalidatePath(`/admin/musteriler/${id}`);
  return { success: true };
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/admin/musteriler");
  return { success: true };
}

export async function updateCustomerSegment(id: string, segment: string | null) {
  const prev = await prisma.customer.findUnique({ where: { id }, select: { segment: true, name: true } });
  await prisma.customer.update({ where: { id }, data: { segment } });
  await logActivity({
    action:   "CUSTOMER_SEGMENT_CHANGED",
    entity:   "CUSTOMER",
    entityId: id,
    detail:   { name: prev?.name, from: prev?.segment, to: segment },
  });
  revalidatePath("/admin/musteriler");
  revalidatePath(`/admin/musteriler/${id}`);
  return { success: true };
}

export async function updateCustomerTags(id: string, tags: string[]) {
  await prisma.customer.update({ where: { id }, data: { tags } });
  revalidatePath("/admin/musteriler");
  revalidatePath(`/admin/musteriler/${id}`);
  return { success: true };
}

export async function addCustomerNote(customerId: string, content: string) {
  const session = await auth();
  const createdBy = session?.user?.email ?? "admin";
  const note = await prisma.customerNote.create({
    data: { customerId, content: content.trim(), createdBy },
  });
  await logActivity({
    action:   "CUSTOMER_NOTE_ADDED",
    entity:   "CUSTOMER",
    entityId: customerId,
    detail:   { noteId: note.id },
  });
  revalidatePath(`/admin/musteriler/${customerId}`);
  return { success: true };
}

export async function deleteCustomerNote(noteId: string, customerId: string) {
  await prisma.customerNote.delete({ where: { id: noteId } });
  await logActivity({
    action:   "CUSTOMER_NOTE_DELETED",
    entity:   "CUSTOMER",
    entityId: customerId,
    detail:   { noteId },
  });
  revalidatePath(`/admin/musteriler/${customerId}`);
  return { success: true };
}
