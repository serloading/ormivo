"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/actions/activity-log";
import { auth } from "@/lib/auth";
import { syncSiteUserFromCustomerPhone } from "@/lib/site-user-sync";
import { canonicalPhone, phoneLookupVariants } from "@/lib/phone";

// Varsayılan şifre: admin tarafından oluşturulan müşterilere atanır
const DEFAULT_PASSWORD = "Ormivo2025!@#";

export type CustomerFormData = {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  note?: string;
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
      notes: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" } },
      siteOrders: { orderBy: { createdAt: "desc" } },
    },
  });
}

async function generateCustomerNo(): Promise<string> {
  const all = await prisma.customer.findMany({
    where: { customerNo: { not: null } },
    select: { customerNo: true },
  });
  const maxNum = all.reduce((max, c) => {
    const n = c.customerNo ? parseInt(c.customerNo.replace("MUS-", ""), 10) : 0;
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `MUS-${String(maxNum + 1).padStart(4, "0")}`;
}

export async function createCustomer(data: CustomerFormData) {
  try {
    const customerNo = await generateCustomerNo();
    const customer = await prisma.customer.create({ data: { ...data, customerNo, tags: [] } });

    // Telefon varsa otomatik SiteUser oluştur (müşteri siteye girebilsin)
    if (data.phone) {
      const phone = canonicalPhone(data.phone);
      const existing = await prisma.siteUser.findFirst({ where: { phone: { in: phoneLookupVariants(data.phone) } } });
      if (!existing) {
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
        await prisma.siteUser.create({
          data: {
            phone,
            name: data.name,
            passwordHash,
            mustChangePassword: true,
          },
        });
      } else {
        await syncSiteUserFromCustomerPhone(phone);
      }
    }

    revalidatePath("/admin/musteriler");
    revalidatePath("/admin/siparisler");
    return { success: true, id: customer.id, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[createCustomer] HATA:", msg);
    return { success: false, id: null, error: msg };
  }
}

export async function createSiteUserForCustomer(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { name: true, phone: true, segment: true },
  });
  if (!customer?.phone) return { error: "Müşteri telefon numarası yok." };

  const phone = canonicalPhone(customer.phone);
  const existing = await prisma.siteUser.findFirst({ where: { phone: { in: phoneLookupVariants(customer.phone) } } });
  if (existing) {
    await syncSiteUserFromCustomerPhone(phone);
    return { success: true, alreadyExists: true };
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  await prisma.siteUser.create({
    data: {
      phone,
      name: customer.name,
      segment: customer.segment ?? null,
      passwordHash,
      mustChangePassword: true,
    },
  });
  return { success: true };
}

export async function backfillCustomerNos() {
  const customers = await prisma.customer.findMany({
    where: { customerNo: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const last = await prisma.customer.findFirst({
    where: { customerNo: { not: null } },
    orderBy: { customerNo: "desc" },
    select: { customerNo: true },
  });
  let num = last?.customerNo ? parseInt(last.customerNo.replace("MUS-", ""), 10) : 0;
  for (const c of customers) {
    num++;
    await prisma.customer.update({
      where: { id: c.id },
      data: { customerNo: `MUS-${String(num).padStart(4, "0")}` },
    });
  }
  return { count: customers.length };
}

export async function updateCustomer(id: string, data: Partial<CustomerFormData>) {
  await prisma.customer.update({ where: { id }, data });
  revalidatePath("/admin/musteriler");
  revalidatePath(`/admin/musteriler/${id}`);
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/admin/musteriler");
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateCustomerSegment(id: string, segment: string | null) {
  const prev = await prisma.customer.findUnique({ where: { id }, select: { segment: true, name: true, phone: true } });
  await prisma.customer.update({ where: { id }, data: { segment } });
  // Aynı telefona sahip SiteUser'a da segmenti yansıt
  if (prev?.phone) {
    await prisma.siteUser.updateMany({ where: { phone: { in: phoneLookupVariants(prev.phone) } }, data: { segment } });
  }
  await logActivity({
    action: "CUSTOMER_SEGMENT_CHANGED",
    entity: "CUSTOMER",
    entityId: id,
    detail: { name: prev?.name, from: prev?.segment, to: segment },
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
    action: "CUSTOMER_NOTE_ADDED",
    entity: "CUSTOMER",
    entityId: customerId,
    detail: { noteId: note.id },
  });
  revalidatePath(`/admin/musteriler/${customerId}`);
  return { success: true };
}

export async function deleteCustomerNote(noteId: string, customerId: string) {
  await prisma.customerNote.delete({ where: { id: noteId } });
  await logActivity({
    action: "CUSTOMER_NOTE_DELETED",
    entity: "CUSTOMER",
    entityId: customerId,
    detail: { noteId },
  });
  revalidatePath(`/admin/musteriler/${customerId}`);
  return { success: true };
}

/** Admin: müşterinin telefon numarasıyla eşleşen SiteUser'a segment ata */
export async function setSiteUserSegment(customerId: string, segment: string | null) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { phone: true } });
  if (!customer?.phone) return { error: "Müşterinin telefon numarası yok." };

  const siteUser = await prisma.siteUser.findFirst({ where: { phone: { in: phoneLookupVariants(customer.phone) } } });
  if (!siteUser) return { error: "Bu telefona ait site üyesi bulunamadı." };

  await prisma.siteUser.update({ where: { id: siteUser.id }, data: { segment } });
  revalidatePath("/admin/musteriler");
  return { success: true };
}
