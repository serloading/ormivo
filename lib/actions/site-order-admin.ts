"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/actions/activity-log";

const CARGO_FEE = 200;

function revalidateAll() {
  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/finans");
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/musteriler");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Creates one Finance "Ürün Maliyeti" EXPENSE per product line.
// Works for both web (siteOrderId) and manuel (no siteOrderId, matched by description).
async function ensureCostExpenses(
  order: { id: string; orderNo: string; items: unknown },
  source: "web" | "manuel"
) {
  const items = order.items as { productId?: string; name: string; qty: number }[];
  const productIds = items.map((i) => i.productId).filter(Boolean) as string[];
  if (productIds.length === 0) return;

  const products = await prisma.product.findMany({
    where:  { id: { in: productIds } },
    select: { id: true, name: true, costPrice: true },
  });

  // Deduplicate by description
  const existingCosts = await prisma.finance.findMany({
    where: { description: { contains: `#${order.orderNo}` }, category: "Ürün Maliyeti" },
    select: { description: true },
  });
  const existingDescs = new Set(existingCosts.map((e) => e.description));

  for (const item of items) {
    if (!item.productId) continue;
    const product = products.find((p) => p.id === item.productId);
    if (!product?.costPrice) continue;

    const cost = Number(product.costPrice) * item.qty;
    const desc = `Ürün maliyeti — ${item.name} — #${order.orderNo}`;
    if (existingDescs.has(desc)) continue;

    await prisma.finance.create({
      data: {
        type:        "EXPENSE",
        amount:      cost,
        description: desc,
        category:    "Ürün Maliyeti",
        siteOrderId: source === "web" ? order.id : null,
      },
    });
  }
}

// Restores stock for all items in an order (called on cancellation).
async function restoreStock(items: unknown) {
  const rows = items as { productId?: string; qty: number }[];
  for (const item of rows) {
    if (!item.productId) continue;
    try {
      await prisma.product.update({
        where: { id: item.productId },
        data:  { stock: { increment: item.qty } },
      });
    } catch {
      // product may have been deleted — skip silently
    }
  }
}

// Sipariş düzenlenince stok farkını uygula (eski - yeni)
async function applyStockDiff(
  prevItems: { productId?: string; qty: number }[],
  newItems: { productId?: string; qty: number }[]
) {
  // Ürün bazında qty değişimini hesapla
  const prevMap = new Map<string, number>();
  for (const i of prevItems) if (i.productId) prevMap.set(i.productId, (prevMap.get(i.productId) ?? 0) + i.qty);
  const newMap = new Map<string, number>();
  for (const i of newItems) if (i.productId) newMap.set(i.productId, (newMap.get(i.productId) ?? 0) + i.qty);

  // Tüm productId'leri topla
  const allIds = new Set([...prevMap.keys(), ...newMap.keys()]);
  for (const productId of allIds) {
    const prev = prevMap.get(productId) ?? 0;
    const next = newMap.get(productId) ?? 0;
    const diff = next - prev; // pozitif = daha fazla alındı (stok azalır), negatif = iade (stok artar)
    if (diff === 0) continue;
    try {
      await prisma.product.update({
        where: { id: productId },
        data:  { stock: { increment: -diff } }, // diff>0 ise azalt, diff<0 ise artır
      });
    } catch { /* ürün silinmişse sessizce geç */ }
  }
}

async function syncCargoExpense(orderId: string, orderNo: string, deliveryMethod: string) {
  const existing = await prisma.finance.findFirst({ where: { siteOrderId: orderId, category: "Kargo Gideri" } });
  if (deliveryMethod === "CARGO") {
    if (!existing) {
      await prisma.finance.create({
        data: { type: "EXPENSE", amount: CARGO_FEE, description: `Kargo — Sipariş #${orderNo}`, category: "Kargo Gideri", siteOrderId: orderId },
      });
    }
  } else {
    if (existing) {
      await prisma.finance.delete({ where: { id: existing.id } });
    }
  }
}

// ── Web order actions ─────────────────────────────────────────────────────────

export async function updateTrackingNo(orderId: string, trackingNo: string, cargoCompany: string) {
  await prisma.siteOrder.update({
    where: { id: orderId },
    data: {
      trackingNo:   trackingNo.trim()   || null,
      cargoCompany: cargoCompany.trim() || null,
    },
  });
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateManuelOrderTracking(orderId: string, trackingNo: string, cargoCompany: string) {
  // Kargo bilgisini note olarak değil, CargoTracking üzerinden saklayabiliriz
  // Şimdilik Order.note alanına eklemek yerine CargoTracking upsert edelim
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { customerId: true } });
  if (order.customerId) {
    await prisma.cargoTracking.upsert({
      where:  { orderId },
      create: { orderId, customerId: order.customerId, company: cargoCompany.trim() || null, trackingNo: trackingNo.trim() || null },
      update: { company: cargoCompany.trim() || null, trackingNo: trackingNo.trim() || null },
    });
  }
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateSiteOrderStatus(orderId: string, status: string) {
  if (status === "CANCELLED") {
    const order = await prisma.siteOrder.findUniqueOrThrow({
      where:  { id: orderId },
      select: { id: true, items: true, orderNo: true, status: true },
    });

    const deleted = await prisma.finance.deleteMany({ where: { siteOrderId: orderId } });
    await prisma.finance.deleteMany({ where: { description: { contains: `#${order.orderNo}` } } });
    await restoreStock(order.items);

    await logActivity({
      action:   "ORDER_CANCELLED",
      entity:   "ORDER",
      entityId: orderId,
      detail:   { orderNo: order.orderNo, previousStatus: order.status, financeRecordsDeleted: deleted.count },
    });

    revalidatePath("/admin/finans");
    revalidatePath("/admin/urunler");
    revalidatePath("/admin/dashboard");
  } else {
    const prev = await prisma.siteOrder.findUnique({ where: { id: orderId }, select: { status: true, orderNo: true } });
    await logActivity({
      action:   "ORDER_STATUS_CHANGED",
      entity:   "ORDER",
      entityId: orderId,
      detail:   { orderNo: prev?.orderNo, from: prev?.status, to: status },
    });
  }

  await prisma.siteOrder.update({ where: { id: orderId }, data: { status: status as never } });
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateDeliveryMethod(orderId: string, deliveryMethod: string) {
  await prisma.siteOrder.update({ where: { id: orderId }, data: { deliveryMethod } });

  if (deliveryMethod === "CARGO") {
    const existing = await prisma.finance.findFirst({ where: { siteOrderId: orderId, category: "Kargo Gideri" } });
    if (!existing) {
      await prisma.finance.create({
        data: { type: "EXPENSE", amount: CARGO_FEE, description: `Kargo — Sipariş #${orderId.slice(-6)}`, category: "Kargo Gideri", siteOrderId: orderId },
      });
    }
  } else {
    await prisma.finance.deleteMany({ where: { siteOrderId: orderId, category: "Kargo Gideri" } });
  }

  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/finans");
  return { success: true };
}

export async function updateSiteOrderDiscount(orderId: string, discount: number) {
  const order = await prisma.siteOrder.update({ where: { id: orderId }, data: { discount } });

  if (order.paymentStatus === "PAID") {
    const netAmount = Math.max(0, Number(order.total) - discount);
    const income = await prisma.finance.findFirst({ where: { siteOrderId: orderId, type: "INCOME" } });
    if (income) {
      await prisma.finance.update({ where: { id: income.id }, data: { amount: netAmount } });
    }
    revalidatePath("/admin/finans");
  }

  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
  const prev = await prisma.siteOrder.findUnique({ where: { id: orderId }, select: { paymentStatus: true, orderNo: true } });
  const order = await prisma.siteOrder.update({ where: { id: orderId }, data: { paymentStatus } });
  await logActivity({
    action:   "ORDER_PAYMENT_CHANGED",
    entity:   "ORDER",
    entityId: orderId,
    detail:   { orderNo: prev?.orderNo, from: prev?.paymentStatus, to: paymentStatus },
  });

  if (paymentStatus === "PAID") {
    const existingIncome = await prisma.finance.findFirst({ where: { siteOrderId: orderId, type: "INCOME" } });
    if (!existingIncome) {
      const netAmount = Math.max(0, Number(order.total) - Number(order.discount ?? 0));
      await prisma.finance.create({
        data: {
          type:        "INCOME",
          amount:      netAmount,
          description: `Sipariş #${order.orderNo}${Number(order.discount) > 0 ? ` (${Number(order.discount).toLocaleString("tr-TR")}₺ iskonto)` : ""}`,
          category:    "Satış",
          siteOrderId: orderId,
        },
      });
    }
    await ensureCostExpenses(order, "web");
    await syncCargoExpense(orderId, order.orderNo, order.deliveryMethod ?? "");
    revalidatePath("/admin/finans");
  }

  if (paymentStatus === "FREE") {
    // Gelir yok ama ürün maliyeti ve kargo gideri yine de kaydedilmeli
    await prisma.finance.deleteMany({ where: { siteOrderId: orderId, type: "INCOME" } });
    await ensureCostExpenses(order, "web");
    await syncCargoExpense(orderId, order.orderNo, order.deliveryMethod ?? "");
    revalidatePath("/admin/finans");
  }

  if (paymentStatus === "PENDING") {
    // Ödeme bekleniyor: gelir ve gider kayıtlarını temizle
    await prisma.finance.deleteMany({ where: { siteOrderId: orderId } });
    revalidatePath("/admin/finans");
  }

  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/borc-alacak");
  return { success: true };
}

// ── Manuel order actions ──────────────────────────────────────────────────────

export async function updateManuelOrderPayment(orderId: string, paymentStatus: string) {
  const prev = await prisma.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true, orderNo: true } });
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus } });
  await logActivity({
    action:   "ORDER_PAYMENT_CHANGED",
    entity:   "ORDER",
    entityId: orderId,
    detail:   { orderNo: prev?.orderNo, from: prev?.paymentStatus, to: paymentStatus, source: "manuel" },
  });

  if (paymentStatus === "PAID") {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

    // INCOME
    const existingIncome = await prisma.finance.findFirst({
      where: { description: { contains: `Sipariş #${order.orderNo}` }, type: "INCOME" },
    });
    if (!existingIncome) {
      await prisma.finance.create({
        data: { type: "INCOME", amount: order.total, description: `Sipariş #${order.orderNo} (Manuel)`, category: "Satış" },
      });
    }

    // Ürün maliyeti EXPENSE — aynı mantık web siparişiyle özdeş
    await ensureCostExpenses(
      { id: orderId, orderNo: order.orderNo, items: order.items },
      "manuel"
    );

    revalidatePath("/admin/finans");
  }

  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateManuelOrderDelivery(orderId: string, deliveryMethod: string) {
  await prisma.order.update({ where: { id: orderId }, data: { deliveryMethod } });
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateManuelOrderTotal(orderId: string, total: number) {
  const order = await prisma.order.update({ where: { id: orderId }, data: { total }, select: { orderNo: true, paymentStatus: true } });
  // Ödeme alınmışsa gelir kaydını güncelle
  if (order.paymentStatus === "PAID") {
    const income = await prisma.finance.findFirst({
      where: { description: { contains: `Sipariş #${order.orderNo}` }, type: "INCOME" },
    });
    if (income) await prisma.finance.update({ where: { id: income.id }, data: { amount: total } });
    revalidatePath("/admin/finans");
  }
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateManuelOrderStatus(orderId: string, status: string) {
  if (status === "CANCELLED") {
    const order = await prisma.order.findUniqueOrThrow({
      where:  { id: orderId },
      select: { orderNo: true, items: true, status: true },
    });

    const deleted = await prisma.finance.deleteMany({
      where: { description: { contains: `#${order.orderNo}` } },
    });
    await restoreStock(order.items);

    await logActivity({
      action:   "ORDER_CANCELLED",
      entity:   "ORDER",
      entityId: orderId,
      detail:   { orderNo: order.orderNo, previousStatus: order.status, source: "manuel", financeRecordsDeleted: deleted.count },
    });

    revalidatePath("/admin/finans");
    revalidatePath("/admin/urunler");
    revalidatePath("/admin/dashboard");
  } else {
    const prev = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, orderNo: true } });
    await logActivity({
      action:   "ORDER_STATUS_CHANGED",
      entity:   "ORDER",
      entityId: orderId,
      detail:   { orderNo: prev?.orderNo, from: prev?.status, to: status, source: "manuel" },
    });
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: status as never } });
  revalidatePath("/admin/siparisler");
  return { success: true };
}

// ── Product cost rebuild ──────────────────────────────────────────────────────

// Called when a product's costPrice changes — updates all existing cost Finance records.
export async function rebuildCostExpensesForProduct(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, costPrice: true } });
  if (!product?.costPrice) return;

  // Web orders (PAID or FREE)
  const paidWebOrders = await prisma.siteOrder.findMany({
    where:  { paymentStatus: { in: ["PAID", "FREE"] } },
    select: { id: true, orderNo: true, items: true },
  });

  for (const order of paidWebOrders) {
    const items = order.items as { productId?: string; name: string; qty: number }[];
    for (const item of items.filter((i) => i.productId === productId)) {
      const desc    = `Ürün maliyeti — ${item.name} — #${order.orderNo}`;
      const newCost = Number(product.costPrice) * item.qty;
      const existing = await prisma.finance.findFirst({
        where: { siteOrderId: order.id, category: "Ürün Maliyeti", description: desc },
      });
      if (existing) {
        await prisma.finance.update({ where: { id: existing.id }, data: { amount: newCost } });
      } else {
        await prisma.finance.create({
          data: { type: "EXPENSE", amount: newCost, description: desc, category: "Ürün Maliyeti", siteOrderId: order.id },
        });
      }
    }
  }

  // Manuel orders (PAID)
  const paidManuelOrders = await prisma.order.findMany({
    where:  { paymentStatus: "PAID" },
    select: { id: true, orderNo: true, items: true },
  });

  for (const order of paidManuelOrders) {
    const items = order.items as { productId?: string; name: string; qty: number }[];
    for (const item of items.filter((i) => i.productId === productId)) {
      const desc    = `Ürün maliyeti — ${item.name} — #${order.orderNo}`;
      const newCost = Number(product.costPrice) * item.qty;
      const existing = await prisma.finance.findFirst({
        where: { description: desc, category: "Ürün Maliyeti" },
      });
      if (existing) {
        await prisma.finance.update({ where: { id: existing.id }, data: { amount: newCost } });
      } else {
        await prisma.finance.create({
          data: { type: "EXPENSE", amount: newCost, description: desc, category: "Ürün Maliyeti" },
        });
      }
    }
  }

  revalidatePath("/admin/finans");
}

// ── Edit & Delete ─────────────────────────────────────────────────────────────

type OrderItem = { name: string; qty: number; price: number; productId?: string };

// total = gross total (before discount); discount is passed separately in extra
export async function updateOrderItems(
  orderId: string,
  source: "web" | "manuel",
  items: OrderItem[],
  total: number,      // gross total (sum of items)
  note: string | null,
  extra?: { customerId?: string; discount?: number; status?: string; deliveryMethod?: string }
) {
  const discount = extra?.discount ?? 0;
  const netIncome = Math.max(0, total - discount); // actual income after discount

  if (source === "web") {
    // Stok farkı: eski items ile yeni items arasındaki farkı hesapla
    const prevOrder = await prisma.siteOrder.findUniqueOrThrow({
      where: { id: orderId },
      select: { items: true },
    });
    const prevItems = prevOrder.items as { productId?: string; qty: number }[];
    await applyStockDiff(prevItems, items);

    const order = await prisma.siteOrder.update({
      where: { id: orderId },
      data: {
        items: items as never,
        total,           // store gross total
        discount,        // store discount separately
        note,
        ...(extra?.status && { status: extra.status as never }),
        ...(extra?.deliveryMethod !== undefined && { deliveryMethod: extra.deliveryMethod }),
      },
    });

    // Sync finance for PAID orders
    if (order.paymentStatus === "PAID") {
      const income = await prisma.finance.findFirst({ where: { siteOrderId: orderId, type: "INCOME" } });
      if (income) {
        await prisma.finance.update({ where: { id: income.id }, data: { amount: netIncome } });
      } else {
        // Create income record if missing
        await prisma.finance.create({
          data: { type: "INCOME", amount: netIncome, description: `Sipariş #${order.orderNo}${discount > 0 ? ` (${discount.toLocaleString("tr-TR")}₺ iskonto)` : ""}`, category: "Satış", siteOrderId: orderId },
        });
      }
    }

    // Rebuild cost expenses for PAID or FREE
    if (order.paymentStatus === "PAID" || order.paymentStatus === "FREE") {
      await prisma.finance.deleteMany({ where: { siteOrderId: orderId, category: "Ürün Maliyeti" } });
      await ensureCostExpenses({ id: orderId, orderNo: order.orderNo, items }, "web");
    }

    // Sync cargo expense regardless of payment status
    const deliveryMethod = extra?.deliveryMethod ?? order.deliveryMethod;
    if (deliveryMethod === "CARGO") {
      const existing = await prisma.finance.findFirst({ where: { siteOrderId: orderId, category: "Kargo Gideri" } });
      if (!existing) {
        await prisma.finance.create({
          data: { type: "EXPENSE", amount: CARGO_FEE, description: `Kargo — Sipariş #${order.orderNo}`, category: "Kargo Gideri", siteOrderId: orderId },
        });
      }
    } else {
      await prisma.finance.deleteMany({ where: { siteOrderId: orderId, category: "Kargo Gideri" } });
    }
  } else {
    // Stok farkı: eski items ile yeni items arasındaki farkı hesapla
    const prevOrder = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { items: true },
    });
    const prevItems = prevOrder.items as { productId?: string; qty: number }[];
    await applyStockDiff(prevItems, items);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        items: items as never,
        total,  // manuel orders: total is the net total (no separate discount)
        note,
        ...(extra?.customerId && { customerId: extra.customerId }),
        ...(extra?.status && { status: extra.status as never }),
        ...(extra?.deliveryMethod !== undefined && { deliveryMethod: extra.deliveryMethod }),
      },
    });

    // Sync finance if paid
    if (order.paymentStatus === "PAID") {
      const income = await prisma.finance.findFirst({
        where: { description: { contains: `Sipariş #${order.orderNo}` }, type: "INCOME" },
      });
      if (income) {
        await prisma.finance.update({ where: { id: income.id }, data: { amount: total } });
      } else {
        await prisma.finance.create({
          data: { type: "INCOME", amount: total, description: `Sipariş #${order.orderNo} (Manuel)`, category: "Satış" },
        });
      }

      // Rebuild cost expenses
      await prisma.finance.deleteMany({ where: { description: { contains: `#${order.orderNo}` }, category: "Ürün Maliyeti" } });
      await ensureCostExpenses({ id: orderId, orderNo: order.orderNo, items }, "manuel");
    }
  }

  revalidateAll();
  return { success: true };
}

export async function deleteOrderById(orderId: string, source: "web" | "manuel") {
  if (source === "web") {
    const order = await prisma.siteOrder.findUniqueOrThrow({
      where: { id: orderId },
      select: { orderNo: true, items: true },
    });
    await prisma.finance.deleteMany({ where: { siteOrderId: orderId } });
    await prisma.finance.deleteMany({ where: { description: { contains: `#${order.orderNo}` } } });
    await restoreStock(order.items);
    await prisma.siteOrder.delete({ where: { id: orderId } });
  } else {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { orderNo: true, items: true },
    });
    await prisma.finance.deleteMany({ where: { description: { contains: `#${order.orderNo}` } } });
    await restoreStock(order.items);
    await prisma.order.delete({ where: { id: orderId } });
  }
  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/finans");
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
