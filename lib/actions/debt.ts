"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
function calcStatus(paid: number, total: number): string {
  if (paid <= 0) return "BEKLIYOR";
  if (paid >= total) return "ODENDI";
  return "KISMI";
}

// ─────────────────────────────────────────
// CUSTOMER DEBTS
// ─────────────────────────────────────────
export async function getCustomerDebts() {
  return prisma.customerDebt.findMany({
    include: { customer: true, order: true, payments: { orderBy: { paidAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomerDebt(data: {
  customerId: string;
  orderId?: string;
  description: string;
  totalAmount: number;
  initialPayment?: number;
  dueDate?: string;
}) {
  const paid = data.initialPayment ?? 0;
  const debt = await prisma.customerDebt.create({
    data: {
      customerId:  data.customerId,
      orderId:     data.orderId || undefined,
      description: data.description,
      totalAmount: data.totalAmount,
      paidAmount:  paid,
      dueDate:     data.dueDate ? new Date(data.dueDate) : undefined,
      status:      calcStatus(paid, data.totalAmount),
    },
  });
  if (paid > 0) {
    await prisma.debtPayment.create({
      data: { debtId: debt.id, amount: paid, note: "İlk ödeme" },
    });
  }
  revalidatePath("/admin/borc-alacak");
  return debt;
}

export async function addCustomerPayment(data: {
  debtId: string;
  amount: number;
  note?: string;
}) {
  const debt = await prisma.customerDebt.findUniqueOrThrow({ where: { id: data.debtId } });
  const newPaid = debt.paidAmount + data.amount;
  const newStatus = calcStatus(newPaid, debt.totalAmount);

  await Promise.all([
    prisma.debtPayment.create({
      data: { debtId: data.debtId, amount: data.amount, note: data.note },
    }),
    prisma.customerDebt.update({
      where: { id: data.debtId },
      data: { paidAmount: newPaid, status: newStatus },
    }),
  ]);

  // İlişkili siparişin ödeme durumunu güncelle
  const paymentStatus = newStatus === "ODENDI" ? "PAID" : "PARTIAL";
  if (debt.orderId) {
    // Manuel sipariş (Order)
    await prisma.order.updateMany({
      where: { id: debt.orderId },
      data:  { paymentStatus },
    }).catch(() => {});
  } else if (debt.description.startsWith("Web Sipariş #")) {
    // Web siparişi — description'dan orderNo parse et
    const orderNo = debt.description.replace("Web Sipariş #", "").trim();
    await prisma.siteOrder.updateMany({
      where: { orderNo },
      data:  { paymentStatus },
    }).catch(() => {});
  }

  revalidatePath("/admin/borc-alacak");
  revalidatePath("/admin/siparisler");
  revalidatePath("/hesabim", "layout");
}

export async function createDebtFromSiteOrder(data: {
  siteOrderId: string;
  customerId: string;
  customerName: string;
  orderNo: string;
  totalAmount: number;
  initialPayment: number;
}) {
  const paid = data.initialPayment;
  const debt = await prisma.customerDebt.create({
    data: {
      customerId:  data.customerId,
      siteOrderId: data.siteOrderId,
      description: `Web Sipariş #${data.orderNo}`,
      totalAmount: data.totalAmount,
      paidAmount:  paid,
      status:      calcStatus(paid, data.totalAmount),
    },
  });
  if (paid > 0) {
    await prisma.debtPayment.create({
      data: { debtId: debt.id, amount: paid, note: "İlk ödeme" },
    });
  }
  // SiteOrder paymentStatus güncelle
  const paymentStatus = calcStatus(paid, data.totalAmount) === "ODENDI" ? "PAID"
    : paid > 0 ? "PARTIAL" : "PENDING";
  await prisma.siteOrder.update({
    where: { id: data.siteOrderId },
    data:  { paymentStatus },
  });
  revalidatePath("/admin/borc-alacak");
  revalidatePath("/admin/siparisler");
  revalidatePath("/hesabim", "layout");
  return debt;
}

export async function createDebtFromB2BOrder(data: {
  orderId: string;
  customerId: string;
  orderNo: string;
  totalAmount: number;
  initialPayment: number;
  note?: string;
}) {
  const paid = data.initialPayment;
  const debt = await prisma.customerDebt.create({
    data: {
      customerId:  data.customerId,
      orderId:     data.orderId,
      description: `Manuel Sipariş #${data.orderNo}`,
      totalAmount: data.totalAmount,
      paidAmount:  paid,
      status:      calcStatus(paid, data.totalAmount),
    },
  });
  if (paid > 0) {
    await prisma.debtPayment.create({
      data: { debtId: debt.id, amount: paid, note: data.note || "İlk ödeme" },
    });
  }
  await prisma.order.update({
    where: { id: data.orderId },
    data:  { paymentStatus: calcStatus(paid, data.totalAmount) === "ODENDI" ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING" },
  });
  revalidatePath("/admin/borc-alacak");
  revalidatePath("/admin/siparisler");
  revalidatePath("/hesabim", "layout");
  return debt;
}

export async function deleteCustomerDebt(id: string) {
  await prisma.debtPayment.deleteMany({ where: { debtId: id } });
  await prisma.customerDebt.delete({ where: { id } });
  revalidatePath("/admin/borc-alacak");
}

// ─────────────────────────────────────────
// SUPPLIER DEBTS
// ─────────────────────────────────────────
export async function getSupplierDebts() {
  return prisma.supplierDebt.findMany({
    include: { payments: { orderBy: { paidAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSupplierNames() {
  const debts = await prisma.supplierDebt.findMany({ select: { supplierName: true }, distinct: ["supplierName"] });
  return [...new Set((debts as Array<{ supplierName: string }>).map((d) => d.supplierName))].sort();
}

export async function createSupplierDebt(data: {
  supplierName: string;
  description: string;
  totalAmount: number;
  initialPayment?: number;
  dueDate?: string;
}) {
  const paid = data.initialPayment ?? 0;
  const debt = await prisma.supplierDebt.create({
    data: {
      supplierName: data.supplierName,
      description:  data.description,
      totalAmount:  data.totalAmount,
      paidAmount:   paid,
      dueDate:      data.dueDate ? new Date(data.dueDate) : undefined,
      status:       calcStatus(paid, data.totalAmount),
    },
  });
  if (paid > 0) {
    await prisma.supplierPayment.create({
      data: { debtId: debt.id, amount: paid, note: "İlk ödeme" },
    });
  }
  revalidatePath("/admin/borc-alacak");
  return debt;
}

export async function addSupplierPayment(data: {
  debtId: string;
  amount: number;
  note?: string;
}) {
  const debt = await prisma.supplierDebt.findUniqueOrThrow({ where: { id: data.debtId } });
  const newPaid = debt.paidAmount + data.amount;
  await Promise.all([
    prisma.supplierPayment.create({
      data: { debtId: data.debtId, amount: data.amount, note: data.note },
    }),
    prisma.supplierDebt.update({
      where: { id: data.debtId },
      data: { paidAmount: newPaid, status: calcStatus(newPaid, debt.totalAmount) },
    }),
  ]);
  revalidatePath("/admin/borc-alacak");
}

export async function deleteSupplierDebt(id: string) {
  await prisma.supplierPayment.deleteMany({ where: { debtId: id } });
  await prisma.supplierDebt.delete({ where: { id } });
  revalidatePath("/admin/borc-alacak");
}

// ─────────────────────────────────────────
// SUMMARY STATS
// ─────────────────────────────────────────
export async function getDebtStats() {
  const [cDebts, sDebts] = await Promise.all([
    prisma.customerDebt.findMany(),
    prisma.supplierDebt.findMany(),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [cdPayments, sdPayments] = await Promise.all([
    prisma.debtPayment.findMany({ where: { paidAt: { gte: monthStart } } }),
    prisma.supplierPayment.findMany({ where: { paidAt: { gte: monthStart } } }),
  ]);

  type DebtRow    = { totalAmount: number; paidAmount: number; dueDate: Date | null; status: string };
  type PaymentRow = { amount: number };
  const totalReceivable = (cDebts as DebtRow[]).reduce((s: number, d: DebtRow) => s + (d.totalAmount - d.paidAmount), 0);
  const totalOwed       = (sDebts as DebtRow[]).reduce((s: number, d: DebtRow) => s + (d.totalAmount - d.paidAmount), 0);
  const collectedMonth  = (cdPayments as PaymentRow[]).reduce((s: number, p: PaymentRow) => s + p.amount, 0)
                        + (sdPayments as PaymentRow[]).reduce((s: number, p: PaymentRow) => s + p.amount, 0);
  const overdue = [...(cDebts as DebtRow[]), ...(sDebts as DebtRow[])].filter(
    (d: DebtRow) => d.dueDate && new Date(d.dueDate) < now && d.status !== "ODENDI"
  ).length;

  return { totalReceivable, totalOwed, collectedMonth, overdue };
}
