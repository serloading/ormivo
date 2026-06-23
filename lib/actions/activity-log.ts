"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type LogAction =
  | "ORDER_STATUS_CHANGED"
  | "ORDER_CANCELLED"
  | "ORDER_PAYMENT_CHANGED"
  | "PRODUCT_PRICE_CHANGED"
  | "FINANCE_MANUAL_ENTRY"
  | "FINANCE_DELETED"
  | "CUSTOMER_SEGMENT_CHANGED"
  | "CUSTOMER_NOTE_ADDED"
  | "CUSTOMER_NOTE_DELETED";

export type LogEntity = "ORDER" | "PRODUCT" | "FINANCE" | "CUSTOMER";

export async function logActivity(params: {
  action: LogAction;
  entity: LogEntity;
  entityId: string;
  detail?: Record<string, unknown>;
}) {
  try {
    const session = await auth();
    const adminEmail = session?.user?.email ?? "system";
    await prisma.activityLog.create({
      data: {
        adminEmail,
        action:   params.action,
        entity:   params.entity,
        entityId: params.entityId,
        detail:   (params.detail ?? null) as never,
      },
    });
  } catch {
    // Log hatası ana işlemi engellemez
  }
}
