"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canonicalPhone } from "@/lib/phone";
import { normalizeOrderItems } from "@/lib/order-items";

export type DepoSiparisItem = { productId?: string; name: string; qty: number; unitPrice: number };
type DepoSourceOrder = { orderId: string; source: "web" | "manuel"; orderNo: string; items: DepoSiparisItem[] };

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
  const existing = await prisma.finance.findFirst({ where: { depoSiparisId } });
  if (shippingFee > 0) {
    if (existing) {
      await prisma.finance.updateMany({
        where: { depoSiparisId },
        data: {
          amount: shippingFee,
          description: `Depo kargo — ${title}`,
          category: "Kargo Gideri",
          date: new Date(orderDate),
        },
      });
    } else {
      await prisma.finance.create({
        data: {
          type: "EXPENSE",
          amount: shippingFee,
          description: `Depo kargo — ${title}`,
          category: "Kargo Gideri",
          date: new Date(orderDate),
          depoSiparisId,
        },
      });
    }
    return;
  }
  if (existing) {
    await prisma.finance.deleteMany({ where: { depoSiparisId } });
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
  const existing = await prisma.supplierDebt.findFirst({ where: { depoSiparisId } });
  const debtName = supplierName?.trim() || null;

  if (remaining > 0 && debtName) {
    if (existing) {
      await prisma.supplierDebt.updateMany({
        where: { depoSiparisId },
        data: {
          supplierName: debtName,
          description: `Depo Siparişi: ${title} (${new Date(orderDate).toLocaleDateString("tr-TR")})`,
          totalAmount: total,
          paidAmount: paid,
          status: calcDebtStatus(paid, total),
        },
      });
    } else {
      await prisma.supplierDebt.create({
        data: {
          supplierName: debtName,
          description: `Depo Siparişi: ${title} (${new Date(orderDate).toLocaleDateString("tr-TR")})`,
          totalAmount: total,
          paidAmount: paid,
          status: calcDebtStatus(paid, total),
          depoSiparisId,
        },
      });
    }
    return;
  }

  if (existing) {
    await prisma.supplierDebt.deleteMany({ where: { depoSiparisId } });
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

// Sipariş kalemlerini depo siparişi kalemlerine çevirir; birim fiyat olarak
// ürünün güncel alış fiyatını (costPriceUsd × güncel USD kuru) kullanır.
// Ürün eşleşmesi yoksa (productId yok/silinmiş ürün) satış fiyatına düşer.
async function buildDepoItemsFromOrder(rawItems: unknown): Promise<DepoSiparisItem[]> {
  const normalized = normalizeOrderItems(rawItems);
  const productIds = normalized.map((i) => i.productId).filter(Boolean) as string[];

  const [products, usdRateRow] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, costPriceUsd: true } })
      : Promise.resolve([]),
    prisma.setting.findUnique({ where: { key: "usd_rate" } }),
  ]);
  const usdRate = usdRateRow ? parseFloat(usdRateRow.value) : 38;
  const costById = new Map(products.map((p) => [p.id, p.costPriceUsd != null ? Number(p.costPriceUsd) : null]));

  return normalized.map((item) => {
    const costUsd = item.productId ? costById.get(item.productId) : null;
    const unitPrice = costUsd != null ? Math.round(costUsd * usdRate * 100) / 100 : item.price;
    return { productId: item.productId, name: item.name, qty: item.qty, unitPrice };
  });
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

export async function addManualOrderToDepo(orderId: string, source: "manuel" | "web" = "manuel") {
  let orderNo: string;
  let customerName: string;
  let rawItems: unknown;

  if (source === "web") {
    const siteOrder = await prisma.siteOrder.findUniqueOrThrow({ where: { id: orderId } });
    if (siteOrder.depoSent) {
      return { success: false as const, error: "Bu sipariş zaten depoya eklendi." };
    }
    orderNo = siteOrder.orderNo;
    customerName = siteOrder.recipientName ?? "Müşteri";
    rawItems = siteOrder.items;
  } else {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { customer: true },
    });
    if (order.depoSent) {
      return { success: false as const, error: "Bu sipariş zaten depoya eklendi." };
    }
    orderNo = order.orderNo;
    customerName = order.customer?.name ?? "Müşteri";
    rawItems = order.items;
  }

  const orderItems = await buildDepoItemsFromOrder(rawItems);

  if (orderItems.length === 0) {
    return { success: false as const, error: "Sipariş içinde aktarılacak ürün bulunamadı." };
  }

  const latestPending = await prisma.depoSiparis.findFirst({
    where: { status: "HAZIRLANIYOR" },
    orderBy: { createdAt: "desc" },
  });

  const sourceNote = `Kaynak sipariş: #${orderNo} - ${customerName}`;

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
    // Kaynak siparişi geri alınabilsin diye kaydet (henüz iletilmemiş depo siparişinden silinebilmesi için)
    const existingSourceOrders = Array.isArray(latestPending.sourceOrders) ? (latestPending.sourceOrders as unknown as DepoSourceOrder[]) : [];
    await prisma.depoSiparis.update({
      where: { id: latestPending.id },
      data: { sourceOrders: [...existingSourceOrders, { orderId, source, orderNo, items: orderItems }] as never },
    });
    // Kaynak sipariş artık bu depo siparişine eklendi — tekrar eklenemesin
    if (source === "web") {
      await prisma.siteOrder.update({ where: { id: orderId }, data: { depoSent: true } });
    } else {
      await prisma.order.update({ where: { id: orderId }, data: { depoSent: true } });
    }
    revalidatePath("/admin/depo-siparisler");
    revalidatePath("/admin/borc-alacak");
    revalidatePath("/admin/finans");
    revalidatePath("/admin/siparisler");
    return { success: true as const, mode: "updated" as const, depoSiparisId: latestPending.id };
  }

  // No open HAZIRLANIYOR order — caller should prompt user to create one.
  // depoSent burada set edilmez: henüz hiçbir depo siparişine eklenmedi.
  return {
    success: false as const,
    needsNewOrder: true as const,
    items: orderItems,
    sourceNote,
  };
}

export async function createDepoSiparisFromOrder(
  orderId: string,
  source: "manuel" | "web",
  depoName: string,
  depoPhone: string,
) {
  let orderNo: string;
  let customerName: string;
  let rawItems: unknown;

  if (source === "web") {
    const siteOrder = await prisma.siteOrder.findUniqueOrThrow({ where: { id: orderId } });
    if (siteOrder.depoSent) {
      return { success: false as const, error: "Bu sipariş zaten depoya eklendi." };
    }
    orderNo = siteOrder.orderNo;
    customerName = siteOrder.recipientName ?? "Müşteri";
    rawItems = siteOrder.items;
  } else {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { customer: true },
    });
    if (order.depoSent) {
      return { success: false as const, error: "Bu sipariş zaten depoya eklendi." };
    }
    orderNo = order.orderNo;
    customerName = order.customer?.name ?? "Müşteri";
    rawItems = order.items;
  }

  const orderItems = await buildDepoItemsFromOrder(rawItems);

  const sourceNote = `Kaynak sipariş: #${orderNo} - ${customerName}`;

  const created = await createDepoSiparis({
    title: "Bekleyen Depo Siparişi",
    orderDate: new Date().toISOString().split("T")[0],
    items: orderItems,
    paidAmount: 0,
    shippingFee: 0,
    depoName: depoName.trim(),
    depoPhone: depoPhone.trim(),
    supplierName: depoName.trim(),
    notes: sourceNote,
  });

  await prisma.depoSiparis.update({
    where: { id: created.id },
    data: { sourceOrders: [{ orderId, source, orderNo, items: orderItems }] as never },
  });

  // Kaynak sipariş artık depoya eklendi — tekrar eklenemesin
  if (source === "web") {
    await prisma.siteOrder.update({ where: { id: orderId }, data: { depoSent: true } });
  } else {
    await prisma.order.update({ where: { id: orderId }, data: { depoSent: true } });
  }

  revalidatePath("/admin/depo-siparisler");
  revalidatePath("/admin/borc-alacak");
  revalidatePath("/admin/finans");
  revalidatePath("/admin/siparisler");
  return { success: true as const, mode: "created" as const, depoSiparisId: created.id };
}

// Bir sipariş silindiğinde, o siparişten "depoya ekle" ile eklenmiş ürünleri
// henüz depoya iletilmemiş (HAZIRLANIYOR) depo siparişlerinden geri çıkarır.
// Depo siparişi zaten depoya iletildiyse (ILETILDI) dokunulmaz.
export async function removeOrderFromDepo(orderId: string, source: "web" | "manuel") {
  const candidates = await prisma.depoSiparis.findMany({ where: { status: "HAZIRLANIYOR" } });

  for (const depo of candidates) {
    const sourceOrders = Array.isArray(depo.sourceOrders) ? (depo.sourceOrders as unknown as DepoSourceOrder[]) : [];
    const match = sourceOrders.find((s) => s.orderId === orderId && s.source === source);
    if (!match) continue;

    const remainingSourceOrders = sourceOrders.filter((s) => !(s.orderId === orderId && s.source === source));
    const currentItems = Array.isArray(depo.items) ? (depo.items as unknown as DepoSiparisItem[]) : [];

    // Kaynak siparişin katkısını satırlardan düş
    const newItems: DepoSiparisItem[] = [];
    for (const item of currentItems) {
      const removedLine = match.items.find(
        (r) =>
          (r.productId && item.productId && r.productId === item.productId) ||
          (!r.productId && !item.productId && r.name.trim().toLowerCase() === item.name.trim().toLowerCase() && Number(r.unitPrice) === Number(item.unitPrice)),
      );
      if (!removedLine) { newItems.push(item); continue; }
      const remainingQty = Number(item.qty) - Number(removedLine.qty);
      if (remainingQty > 0) newItems.push({ ...item, qty: remainingQty });
    }

    const shippingFee = Number(depo.shippingFee) || 0;
    const paid = Number(depo.paidAmount) || 0;

    // Hiç ürün ve kaynak sipariş kalmadıysa ve ödeme yapılmadıysa depo siparişini tamamen kaldır
    if (newItems.length === 0 && remainingSourceOrders.length === 0 && paid === 0) {
      await deleteDepoSiparis(depo.id);
      continue;
    }

    const newTotal = calcTotal(newItems, shippingFee);
    await prisma.depoSiparis.update({
      where: { id: depo.id },
      data: {
        items: newItems as never,
        total: newTotal,
        sourceOrders: remainingSourceOrders as never,
      },
    });
    await syncDerivedRecords({
      depoSiparisId: depo.id,
      shippingFee,
      title: depo.title,
      orderDate: new Date(depo.orderDate).toISOString().split("T")[0],
      supplierName: depo.supplierName ?? depo.depoName ?? undefined,
      total: newTotal,
      paid,
    });
  }

  revalidatePath("/admin/depo-siparisler");
  revalidatePath("/admin/borc-alacak");
  revalidatePath("/admin/finans");
}

export async function getDepoSuppliers(): Promise<{ name: string; phone: string }[]> {
  const row = await prisma.setting.findUnique({ where: { key: "depo_suppliers" } });
  if (!row) return [];
  try { return JSON.parse(row.value) as { name: string; phone: string }[]; } catch { return []; }
}

export async function saveDepoSupplier(name: string, phone: string) {
  const existing = await getDepoSuppliers();
  if (existing.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
    return { error: "Bu tedarikçi zaten kayıtlı." };
  }
  const updated = [...existing, { name: name.trim(), phone: phone.trim() }];
  await prisma.setting.upsert({
    where: { key: "depo_suppliers" },
    create: { key: "depo_suppliers", value: JSON.stringify(updated) },
    update: { value: JSON.stringify(updated) },
  });
  revalidatePath("/admin/depo-siparisler");
  return { success: true };
}

export async function updateDepoSupplier(oldName: string, newName: string, newPhone: string) {
  const existing = await getDepoSuppliers();
  const updated = existing.map((s) =>
    s.name === oldName ? { name: newName.trim(), phone: newPhone.trim() } : s
  );
  await prisma.setting.upsert({
    where: { key: "depo_suppliers" },
    create: { key: "depo_suppliers", value: JSON.stringify(updated) },
    update: { value: JSON.stringify(updated) },
  });
  revalidatePath("/admin/depo-siparisler");
  return { success: true };
}

export async function deleteDepoSupplier(name: string) {
  const existing = await getDepoSuppliers();
  const updated = existing.filter((s) => s.name !== name);
  await prisma.setting.upsert({
    where: { key: "depo_suppliers" },
    create: { key: "depo_suppliers", value: JSON.stringify(updated) },
    update: { value: JSON.stringify(updated) },
  });
  revalidatePath("/admin/depo-siparisler");
}

