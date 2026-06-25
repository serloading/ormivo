"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type DepoSiparisItem = { productId?: string; name: string; qty: number; unitPrice: number };

export async function getDepoSiparisler() {
  return prisma.depoSiparis.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createDepoSiparis(data: {
  title: string;
  orderDate: string;
  items: DepoSiparisItem[];
  paidAmount: number;
  supplierName?: string;
  notes?: string;
}) {
  const total = data.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const paid = Math.min(data.paidAmount, total);
  const remaining = total - paid;

  await prisma.depoSiparis.create({
    data: {
      title: data.title,
      orderDate: new Date(data.orderDate),
      items: data.items,
      total,
      paidAmount: paid,
      supplierName: data.supplierName || null,
      notes: data.notes,
    },
  });

  // Ödenmemiş kısım varsa tedarikçi borcu oluştur
  if (remaining > 0 && data.supplierName) {
    await prisma.supplierDebt.create({
      data: {
        supplierName: data.supplierName,
        description: `Depo Siparişi: ${data.title} (${new Date(data.orderDate).toLocaleDateString("tr-TR")})`,
        totalAmount: total,
        paidAmount: paid,
        status: paid === 0 ? "BEKLIYOR" : "KISMI",
      },
    });
  }

  revalidatePath("/admin/depo-siparisler");
  revalidatePath("/admin/borc-alacak");
}

export async function iletDepoSiparis(id: string) {
  await prisma.depoSiparis.update({ where: { id }, data: { status: "ILETILDI" } });
  revalidatePath("/admin/depo-siparisler");
}

export async function deleteDepoSiparis(id: string) {
  await prisma.depoSiparis.delete({ where: { id } });
  revalidatePath("/admin/depo-siparisler");
}
