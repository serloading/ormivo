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

// ── Web order actions ─────────────────────────────────────────────────────────

export async function updateTrackingNo(orderId: string, trackingNo: string, cargoCompany: string) {
  await prisma.siteOrder.update({
    where: { id: orderId },
    data: {
      trackingNo:   trackingNo.trim()   || null,
      cargoCompany: cargoCompany.trim() || null,
      status:       trackingNo.trim()   ? "SHIPPED" : undefined,
    },
  });
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
    revalidatePath("/admin/finans");
  }

  if (paymentStatus === "FREE") {
    await ensureCostExpenses(order, "web");
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
  await prisma.order.update({ where: { id: orderId }, data: { total } });
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
