"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const CARGO_FEE = 200;

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

// Creates one Finance "Ürün Maliyeti" record per product line in the order.
// Skips products without costPrice. Deduplicates by description.
async function ensureCostExpenses(orderId: string, order: { items: unknown; orderNo: string }) {
  const items = order.items as { productId?: string; name: string; qty: number }[];
  const productIds = items.map((i) => i.productId).filter(Boolean) as string[];
  if (productIds.length === 0) return;

  const products = await prisma.product.findMany({
    where:  { id: { in: productIds } },
    select: { id: true, name: true, costPrice: true },
  });

  const existingCosts = await prisma.finance.findMany({
    where: { siteOrderId: orderId, category: "Ürün Maliyeti" },
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
      data: { type: "EXPENSE", amount: cost, description: desc, category: "Ürün Maliyeti", siteOrderId: orderId },
    });
  }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
  const order = await prisma.siteOrder.update({ where: { id: orderId }, data: { paymentStatus } });

  if (paymentStatus === "PAID") {
    const existingIncome = await prisma.finance.findFirst({ where: { siteOrderId: orderId, type: "INCOME" } });
    if (!existingIncome) {
      const netAmount = Math.max(0, Number(order.total) - Number(order.discount ?? 0));
      await prisma.finance.create({
        data: {
          type: "INCOME", amount: netAmount,
          description: `Sipariş #${order.orderNo}${Number(order.discount) > 0 ? ` (${Number(order.discount).toLocaleString("tr-TR")}₺ iskonto)` : ""}`,
          category: "Satış", siteOrderId: orderId,
        },
      });
    }
    await ensureCostExpenses(orderId, order);
    revalidatePath("/admin/finans");
  }

  if (paymentStatus === "FREE") {
    await ensureCostExpenses(orderId, order);
    revalidatePath("/admin/finans");
  }

  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/borc-alacak");
  return { success: true };
}

export async function updateManuelOrderPayment(orderId: string, paymentStatus: string) {
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus } });

  if (paymentStatus === "PAID") {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const existing = await prisma.finance.findFirst({
      where: { description: { contains: `Sipariş #${order.orderNo}` }, type: "INCOME" },
    });
    if (!existing) {
      await prisma.finance.create({
        data: { type: "INCOME", amount: order.total, description: `Sipariş #${order.orderNo} (Manuel)`, category: "Satış" },
      });
    }
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

// Rebuilds cost Finance records for all paid SiteOrders containing a given product.
// Called when product costPrice is updated.
export async function rebuildCostExpensesForProduct(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, costPrice: true } });
  if (!product?.costPrice) return;

  // Find all paid/free SiteOrders containing this product
  const paidOrders = await prisma.siteOrder.findMany({
    where: { paymentStatus: { in: ["PAID", "FREE"] } },
    select: { id: true, orderNo: true, items: true, paymentStatus: true },
  });

  for (const order of paidOrders) {
    const items = order.items as { productId?: string; name: string; qty: number }[];
    const matching = items.filter((i) => i.productId === productId);
    if (matching.length === 0) continue;

    for (const item of matching) {
      const desc = `Ürün maliyeti — ${item.name} — #${order.orderNo}`;
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

  revalidatePath("/admin/finans");
}
