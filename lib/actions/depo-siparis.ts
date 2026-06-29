"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canonicalPhone } from "@/lib/phone";
import { normalizeOrderItems } from "@/lib/order-items";

export type DepoSiparisItem = { productId?: string; name: string; qty: number; unitPrice: number };

type DepoFormData = {
  title: string;
  orderDate: string;
  items: DepoSiparisItem[];
  paidAmount: number;
  shippingFee: number;
  depoName?: string;
  depoPhone?: string;
  supplierName?: string;
  notes?: string;
};

function calcTotal(items: DepoSiparisItem[], shippingFee: number) {
  return items.reduce((s, i) => s + i.qty * i.unitPrice, 0) + shippingFee;
}

function mergeItems(base: DepoSiparisItem[], incoming: DepoSiparisItem[]) {
  const merged = [...base];
  for (const item of incoming) {
    const match = merged.find(
      (existing) =>
        (existing.productId && item.productId && existing.productId === item.productId) ||
        (!existing.productId && !item.productId && existing.name.trim().toLowerCase() === item.name.trim().toLowerCase() && Number(existing.unitPrice) === Number(item.unitPrice)),
    );
    if (match) {
      match.qty += item.qty;
    } else {
      merged.push({ ...item });
    }
  }
  return merged;
}

function calcDebtStatus(paid: number, total: number) {
  if (paid <= 0) return "BEKLIYOR";
  if (paid >= total) return "ODENDI";
  return "KISMI";
}

async function syncShippingExpense(depoSiparisId: string, shippingFee: number, title: string, orderDate: string) {
  const existing = await prisma.finance.findUnique({ where: { depoSiparisId } });
  if (shippingFee > 0) {
    await prisma.finance.upsert({
      where: { depoSiparisId },
      create: {
        type: "EXPENSE",
        amount: shippingFee,
        description: `Depo kargo â€” ${title}`,
        category: "Kargo Gideri",
        date: new Date(orderDate),
        depoSiparisId,
      },
      update: {
        amount: shippingFee,
        description: `Depo kargo â€” ${title}`,
        category: "Kargo Gideri",
        date: new Date(orderDate),
      },
    });
    return;
  }
  if (existing) {
    await prisma.finance.delete({ where: { depoSiparisId } });
  }
}

async function syncSupplierDebt(params: {
  depoSiparisId: string;
  supplierName?: string;
  title: string;
  orderDate: string;
  total: number;
  paid: number;
}) {
  const { depoSiparisId, supplierName, title, orderDate, total, paid } = params;
  const remaining = Math.max(0, total - paid);
  const existing = await prisma.supplierDebt.findUnique({ where: { depoSiparisId } });
  const debtName = supplierName?.trim() || null;

  if (remaining > 0 && debtName) {
    await prisma.supplierDebt.upsert({
      where: { depoSiparisId },
      create: {
        supplierName: debtName,
        description: `Depo Siparişi: ${title} (${new Date(orderDate).toLocaleDateString("tr-TR")})`,
        totalAmount: total,
        paidAmount: paid,
        status: calcDebtStatus(paid, total),
        depoSiparisId,
      },
      update: {
        supplierName: debtName,
        description: `Depo Siparişi: ${title} (${new Date(orderDate).toLocaleDateString("tr-TR")})`,
        totalAmount: total,
        paidAmount: paid,
        status: calcDebtStatus(paid, total),
      },
    });
    return;
  }

  if (existing) {
    await prisma.supplierDebt.delete({ where: { depoSiparisId } });
  }
}

async function syncDerivedRecords(params: {
  depoSiparisId: string;
  shippingFee: number;
  title: string;
  orderDate: string;
  supplierName?: string;
  total: number;
  paid: number;
}) {
  await Promise.all([
    syncShippingExpense(params.depoSiparisId, params.shippingFee, params.title, params.orderDate),
    syncSupplierDebt({
      depoSiparisId: params.depoSiparisId,
      supplierName: params.supplierName,
      title: params.title,
      orderDate: params.orderDate,
      total: params.total,
      paid: params.paid,
    }),
  ]);
}

export async function getDepoSiparisler() {
  return prisma.depoSiparis.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createDepoSiparis(data: DepoFormData) {
  const items = data.items.filter((i) => i.name.trim());
  const shippingFee = Math.max(0, Number(data.shippingFee) || 0);
  const total = calcTotal(items, shippingFee);
  const paid = Math.min(Math.max(0, Number(data.paidAmount) || 0), total);
  const depoPhone = canonicalPhone(data.depoPhone ?? "");

  const depo = await prisma.depoSiparis.create({
    data: {
      title: data.title,
      orderDate: new Date(data.orderDate),
      items,
      total,
      paidAmount: paid,
      shippingFee,
      depoName: data.depoName?.trim() || null,
      depoPhone: depoPhone || null,
      supplierName: data.supplierName?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });

  await syncDerivedRecords({
    depoSiparisId: depo.id,
    shippingFee,
    title: data.title,
    orderDate: data.orderDate,
    supplierName: data.supplierName || data.depoName,
    total,
    paid,
  });

  revalidatePath("/admin/depo-siparisler");
  revalidatePath("/admin/borc-alacak");
  revalidatePath("/admin/finans");
  return depo;
}

export async function updateDepoSiparis(
  id: string,
  data: DepoFormData & { status?: string },
) {
  const items = data.items.filter((i) => i.name.trim());
  const shippingFee = Math.max(0, Number(data.shippingFee) || 0);
  const total = calcTotal(items, shippingFee);
  const paid = Math.min(Math.max(0, Number(data.paidAmount) || 0), total);
  const depoPhone = canonicalPhone(data.depoPhone ?? "");

  const depo = await prisma.depoSiparis.update({
    where: { id },
    data: {
      title: data.title,
      orderDate: new Date(data.orderDate),
      items,
      total,
      paidAmount: paid,
      shippingFee,
      depoName: data.depoName?.trim() || null,
      depoPhone: depoPhone || null,
      supplierName: data.supplierName?.trim() || null,
      notes: data.notes?.trim() || null,
      status: data.status ?? undefined,
    },
  });

  await syncDerivedRecords({
    depoSiparisId: id,
    shippingFee,
    title: data.title,
    orderDate: data.orderDate,
    supplierName: data.supplierName || data.depoName,
    total,
    paid,
  });

  revalidatePath("/admin/depo-siparisler");
  revalidatePath("/admin/borc-alacak");
  revalidatePath("/admin/finans");
  return depo;
}

export async function iletDepoSiparis(id: string) {
  await prisma.depoSiparis.update({ where: { id }, data: { status: "ILETILDI" } });
  revalidatePath("/admin/depo-siparisler");
}

export async function deleteDepoSiparis(id: string) {
  await prisma.finance.deleteMany({ where: { depoSiparisId: id } });
  await prisma.supplierDebt.deleteMany({ where: { depoSiparisId: id } });
  await prisma.depoSiparis.delete({ where: { id } });
  revalidatePath("/admin/depo-siparisler");
  revalidatePath("/admin/borc-alacak");
  revalidatePath("/admin/finans");
}

export async function addManualOrderToDepo(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { customer: true },
  });

  const orderItems = normalizeOrderItems(order.items).map<DepoSiparisItem>((item) => ({
    productId: undefined,
    name: item.name,
    qty: item.qty,
    unitPrice: item.price,
  }));

  if (orderItems.length === 0) {
    return { success: false, error: "Sipariş içinde aktarılacak ürün bulunamadı." };
  }

  const latestPending = await prisma.depoSiparis.findFirst({
    where: { status: "HAZIRLANIYOR" },
    orderBy: { createdAt: "desc" },
  });

  const sourceNote = `Kaynak sipariş: #${order.orderNo} - ${order.customer?.name ?? "Müşteri"}`;

  if (latestPending) {
    const baseItems = Array.isArray(latestPending.items) ? (latestPending.items as DepoSiparisItem[]) : [];
    const mergedItems = mergeItems(
      baseItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        qty: Number(item.qty) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      })),
      orderItems,
    );
    const existingNotes = latestPending.notes?.trim();
    await updateDepoSiparis(latestPending.id, {
      title: latestPending.title,
      orderDate: new Date(latestPending.orderDate).toISOString().split("T")[0],
      items: mergedItems,
      paidAmount: Number(latestPending.paidAmount) || 0,
      shippingFee: Number(latestPending.shippingFee) || 0,
      depoName: latestPending.depoName ?? "",
      depoPhone: latestPending.depoPhone ?? "",
      supplierName: latestPending.supplierName ?? latestPending.depoName ?? "",
      notes: existingNotes ? `${existingNotes}\n${sourceNote}` : sourceNote,
      status: latestPending.status,
    });
    revalidatePath("/admin/depo-siparisler");
    revalidatePath("/admin/borc-alacak");
    revalidatePath("/admin/finans");
    return { success: true, mode: "updated" as const, depoSiparisId: latestPending.id };
  }

  const created = await createDepoSiparis({
    title: "Bekleyen Depo Siparişi",
    orderDate: new Date().toISOString().split("T")[0],
    items: orderItems,
    paidAmount: 0,
    shippingFee: 0,
    depoName: "",
    depoPhone: "",
    supplierName: "",
    notes: sourceNote,
  });

  revalidatePath("/admin/depo-siparisler");
  revalidatePath("/admin/borc-alacak");
  revalidatePath("/admin/finans");
  return { success: true, mode: "created" as const, depoSiparisId: created.id };
}
