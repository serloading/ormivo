"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/actions/activity-log";
import { normalizeOrderItems } from "@/lib/order-items";
import { auth } from "@/lib/auth";
import { calcDebtStatus, debtStatusToPaymentStatus } from "@/lib/debt-status";
import { phoneLookupVariants } from "@/lib/phone";
import { removeOrderFromDepo } from "@/lib/actions/depo-siparis";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

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
  const items = normalizeOrderItems(order.items);
  const productIds = items.map((i) => i.productId).filter(Boolean) as string[];
  if (productIds.length === 0) return;

  const [products, usdRateRow] = await Promise.all([
    prisma.product.findMany({
      where:  { id: { in: productIds } },
      select: { id: true, name: true, costPriceUsd: true },
    }),
    prisma.setting.findUnique({ where: { key: "usd_rate" } }),
  ]);
  const usdRate = usdRateRow ? parseFloat(usdRateRow.value) : 38;

  // Deduplicate by description
  const existingCosts = await prisma.finance.findMany({
    where: { description: { contains: `#${order.orderNo}` }, category: "Ürün Maliyeti" },
    select: { description: true },
  });
  const existingDescs = new Set(existingCosts.map((e) => e.description));

  for (const item of items) {
    if (!item.productId) continue;
    const product = products.find((p) => p.id === item.productId);
    if (!product?.costPriceUsd) continue;

    const cost = Math.round(Number(product.costPriceUsd) * usdRate) * item.qty;
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
  const rows = normalizeOrderItems(items);
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
  prevItems: unknown,
  newItems: unknown
) {
  const prevRows = normalizeOrderItems(prevItems);
  const newRows = normalizeOrderItems(newItems);
  // Ürün bazında qty değişimini hesapla
  const prevMap = new Map<string, number>();
  for (const i of prevRows) if (i.productId) prevMap.set(i.productId, (prevMap.get(i.productId) ?? 0) + i.qty);
  const newMap = new Map<string, number>();
  for (const i of newRows) if (i.productId) newMap.set(i.productId, (newMap.get(i.productId) ?? 0) + i.qty);

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

// Sipariş kalemleri (dolayısıyla toplamı) değiştiğinde borç/alacak kaydını senkronize eder.
// - CustomerDebt zaten varsa (kısmi ödeme): totalAmount yeni toplama, status yeniden hesaplanır.
// - Yoksa ve sipariş daha önce PAID işaretlenmişse ve yeni toplam artmışsa: aradaki fark için
//   yeni bir CustomerDebt kaydı açılır (paidAmount = eski toplam, yani zaten ödenen kısım).
// - Diğer durumlarda (PENDING/FREE, ya da toplam azaldıysa) dokunulmaz.
async function syncDebtOnItemsUpdate(params: {
  orderId: string;
  source: "web" | "manuel";
  orderNo: string;
  newTotal: number;
  oldTotal: number;
  oldPaymentStatus: string;
  customerId?: string | null;
  recipientPhone?: string | null;
}) {
  const { orderId, source, orderNo, newTotal, oldTotal, oldPaymentStatus } = params;

  const debt = await prisma.customerDebt.findFirst({
    where: source === "web" ? { siteOrderId: orderId } : { orderId },
  });

  if (debt) {
    const newStatus = calcDebtStatus(debt.paidAmount, newTotal);
    await prisma.customerDebt.update({
      where: { id: debt.id },
      data: { totalAmount: newTotal, status: newStatus },
    });
    const newPaymentStatus = debtStatusToPaymentStatus(newStatus);
    if (source === "web") {
      await prisma.siteOrder.update({ where: { id: orderId }, data: { paymentStatus: newPaymentStatus } });
    } else {
      await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: newPaymentStatus } });
    }
    revalidatePath("/admin/borc-alacak");
    return;
  }

  // Borç kaydı yok. Sadece "daha önce tamamen ödenmişti, şimdi toplam arttı" senaryosunda yeni borç açılır.
  if (oldPaymentStatus !== "PAID" || newTotal <= oldTotal) return;

  let customerId = params.customerId ?? null;
  if (!customerId && params.recipientPhone) {
    const variants = phoneLookupVariants(params.recipientPhone);
    const customer = await prisma.customer.findFirst({ where: { phone: { in: variants } } });
    customerId = customer?.id ?? null;
  }
  if (!customerId) return; // müşteri eşleşmesi yoksa borç kaydı açılamaz

  const paidAmount = oldTotal;
  const status = calcDebtStatus(paidAmount, newTotal);
  const description = source === "web" ? `Web Sipariş #${orderNo}` : `Manuel Sipariş #${orderNo}`;

  const newDebt = await prisma.customerDebt.create({
    data: {
      customerId,
      orderId: source === "manuel" ? orderId : undefined,
      siteOrderId: source === "web" ? orderId : undefined,
      description,
      totalAmount: newTotal,
      paidAmount,
      status,
    },
  });
  if (paidAmount > 0) {
    await prisma.debtPayment.create({
      data: { debtId: newDebt.id, amount: paidAmount, note: "Önceki ödeme (ürün güncellemesi öncesi)" },
    });
  }
  const newPaymentStatus = debtStatusToPaymentStatus(status);
  if (source === "web") {
    await prisma.siteOrder.update({ where: { id: orderId }, data: { paymentStatus: newPaymentStatus } });
  } else {
    await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: newPaymentStatus } });
  }
  revalidatePath("/admin/borc-alacak");
}

// ── Web order actions ─────────────────────────────────────────────────────────

export async function updateTrackingNo(orderId: string, trackingNo: string, cargoCompany: string) {
  await requireAdmin();
  const trimmed = trackingNo.trim();
  const updateData: Record<string, unknown> = {
    trackingNo:   trimmed || null,
    cargoCompany: cargoCompany.trim() || null,
  };
  if (trimmed) {
    const existing = await prisma.siteOrder.findUnique({ where: { id: orderId }, select: { status: true } });
    const finalStatuses = ["SHIPPED", "DELIVERED", "CANCELLED"];
    if (existing && !finalStatuses.includes(existing.status as string)) {
      updateData.status = "SHIPPED";
    }
  }
  await prisma.siteOrder.update({ where: { id: orderId }, data: updateData as never });
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateManuelOrderTracking(orderId: string, trackingNo: string, cargoCompany: string) {
  await requireAdmin();
  const trimmed = trackingNo.trim();
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { customerId: true, status: true } });
  if (order.customerId) {
    await prisma.cargoTracking.upsert({
      where:  { orderId },
      create: { orderId, customerId: order.customerId, company: cargoCompany.trim() || null, trackingNo: trimmed || null },
      update: { company: cargoCompany.trim() || null, trackingNo: trimmed || null },
    });
  }
  if (trimmed) {
    const finalStatuses = ["SHIPPED", "DELIVERED", "CANCELLED"];
    if (!finalStatuses.includes(order.status as string)) {
      await prisma.order.update({ where: { id: orderId }, data: { status: "SHIPPED" as never } });
    }
  }
  revalidatePath("/admin/siparisler");
  return { success: true };
}

export async function updateSiteOrderStatus(orderId: string, status: string) {
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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

export async function updateManuelOrderPaymentStatus(orderId: string, paymentStatus: string) {
  await requireAdmin();
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: paymentStatus as never } });
  revalidatePath("/admin/siparisler");
  return { success: true };
}

// ── Product cost rebuild ──────────────────────────────────────────────────────

// NOT USED: Finance records are frozen at order-creation time. USD rate changes do not rewrite history.
async function rebuildCostExpensesForProduct(productId: string) {
  void productId;
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
      select: { items: true, total: true, discount: true, paymentStatus: true, recipientPhone: true },
    });
    const prevItems = prevOrder.items;
    await applyStockDiff(prevItems, items);
    const oldNetIncome = Math.max(0, Number(prevOrder.total) - Number(prevOrder.discount));

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

    // Borç/alacak: eklenen/çıkartılan ürünlere göre mali düzenleme
    await syncDebtOnItemsUpdate({
      orderId,
      source: "web",
      orderNo: order.orderNo,
      newTotal: netIncome,
      oldTotal: oldNetIncome,
      oldPaymentStatus: prevOrder.paymentStatus,
      recipientPhone: prevOrder.recipientPhone,
    });
  } else {
    // Stok farkı: eski items ile yeni items arasındaki farkı hesapla
    const prevOrder = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { items: true, total: true, paymentStatus: true, customerId: true },
    });
    const prevItems = prevOrder.items;
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

    // Borç/alacak: eklenen/çıkartılan ürünlere göre mali düzenleme
    await syncDebtOnItemsUpdate({
      orderId,
      source: "manuel",
      orderNo: order.orderNo,
      newTotal: total,
      oldTotal: Number(prevOrder.total),
      oldPaymentStatus: prevOrder.paymentStatus,
      customerId: extra?.customerId ?? prevOrder.customerId,
    });
  }

  revalidateAll();
  return { success: true };
}

// Borç/alacak sayfasından, mevcut bir siparişe sonradan ekstra ürün ya da
// kargo ücreti eklemek için. Ürün eklenirse sipariş kalemlerine eklenip
// stoktan düşülür (updateOrderItems üzerinden — stok farkı, maliyet ve borç
// senkronizasyonu zaten orada var). Kargo eklenirse sipariş toplamına ve
// "Kargo Gideri" finans kaydına yansır, borç da buna göre güncellenir.
export async function addOrderCharge(
  orderId: string,
  source: "web" | "manuel",
  kind: "product" | "shipping",
  data: { productId?: string; name?: string; qty?: number; price?: number; amount?: number },
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();

  if (kind === "product") {
    const name = data.name?.trim();
    const qty = Math.max(1, Number(data.qty) || 1);
    const price = Math.max(0, Number(data.price) || 0);
    if (!name || price <= 0) return { error: "Ürün adı ve fiyat gerekli." };

    if (source === "web") {
      const order = await prisma.siteOrder.findUniqueOrThrow({ where: { id: orderId }, select: { items: true, total: true, discount: true, note: true } });
      const currentItems = normalizeOrderItems(order.items).map((i) => ({ productId: i.productId, name: i.name, qty: i.qty, price: i.price }));
      const newItems = [...currentItems, { productId: data.productId, name, qty, price }];
      const newGrossTotal = Number(order.total) + qty * price;
      await updateOrderItems(orderId, "web", newItems, newGrossTotal, order.note, { discount: Number(order.discount) });
    } else {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { items: true, total: true, note: true } });
      const currentItems = normalizeOrderItems(order.items).map((i) => ({ productId: i.productId, name: i.name, qty: i.qty, price: i.price }));
      const newItems = [...currentItems, { productId: data.productId, name, qty, price }];
      const newTotal = Number(order.total) + qty * price;
      await updateOrderItems(orderId, "manuel", newItems, newTotal, order.note, {});
    }
    revalidatePath("/admin/borc-alacak");
    return { success: true };
  }

  // kind === "shipping"
  const amount = Math.max(0, Number(data.amount) || 0);
  if (amount <= 0) return { error: "Tutar gerekli." };

  if (source === "web") {
    const order = await prisma.siteOrder.findUniqueOrThrow({ where: { id: orderId } });
    const oldNetTotal = Math.max(0, Number(order.total) - Number(order.discount));
    const newGrossTotal = Number(order.total) + amount;
    const newNetTotal = Math.max(0, newGrossTotal - Number(order.discount));
    await prisma.siteOrder.update({ where: { id: orderId }, data: { total: newGrossTotal } });
    await prisma.finance.create({
      data: { type: "EXPENSE", amount, description: `Ek kargo — Sipariş #${order.orderNo}`, category: "Kargo Gideri", siteOrderId: orderId },
    });
    await syncDebtOnItemsUpdate({
      orderId, source: "web", orderNo: order.orderNo,
      newTotal: newNetTotal, oldTotal: oldNetTotal,
      oldPaymentStatus: order.paymentStatus, recipientPhone: order.recipientPhone,
    });
  } else {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    const oldTotal = Number(order.total);
    const newTotal = oldTotal + amount;
    await prisma.order.update({ where: { id: orderId }, data: { total: newTotal } });
    await prisma.finance.create({
      data: { type: "EXPENSE", amount, description: `Ek kargo — Sipariş #${order.orderNo}`, category: "Kargo Gideri" },
    });
    await syncDebtOnItemsUpdate({
      orderId, source: "manuel", orderNo: order.orderNo,
      newTotal, oldTotal,
      oldPaymentStatus: order.paymentStatus, customerId: order.customerId,
    });
  }

  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/finans");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/borc-alacak");
  revalidatePath("/admin/rapor");
  return { success: true };
}

export async function deleteOrderById(orderId: string, source: "web" | "manuel") {
  await requireAdmin();
  if (source === "web") {
    const order = await prisma.siteOrder.findUniqueOrThrow({
      where: { id: orderId },
      select: { orderNo: true, items: true },
    });
    await prisma.finance.deleteMany({ where: { siteOrderId: orderId } });
    await prisma.finance.deleteMany({ where: { description: { contains: `#${order.orderNo}` } } });
    // Borç/alacak kayıtlarını sil (siteOrderId veya description eşleşmesi)
    const debts = await prisma.customerDebt.findMany({
      where: { OR: [{ siteOrderId: orderId }, { description: { contains: `#${order.orderNo}` } }] },
      select: { id: true },
    });
    if (debts.length > 0) {
      const debtIds = debts.map((d) => d.id);
      await prisma.debtPayment.deleteMany({ where: { debtId: { in: debtIds } } });
      await prisma.customerDebt.deleteMany({ where: { id: { in: debtIds } } });
    }
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
  // Bu siparişten "depoya ekle" ile aktarılmış, henüz iletilmemiş ürünleri de geri çıkar
  await removeOrderFromDepo(orderId, source);
  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/finans");
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/borc-alacak");
  revalidatePath("/hesabim", "layout");
  return { success: true };
}
