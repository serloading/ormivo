"use server";

import { prisma }     from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function addAddress(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Giriş gerekli." };

  const recipientName = (formData.get("recipientName") as string)?.trim();
  const phone         = (formData.get("phone")         as string)?.trim();
  const addressLine   = (formData.get("addressLine")   as string)?.trim();
  const city          = (formData.get("city")          as string)?.trim();
  const district      = (formData.get("district")      as string)?.trim() || null;
  const isDefault     = formData.get("isDefault") === "on";

  if (!recipientName || !phone || !addressLine || !city)
    return { error: "Zorunlu alanları doldurun." };

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.userId },
      data:  { isDefault: false },
    });
  }

  await prisma.address.create({
    data: { userId: session.userId, recipientName, phone, addressLine, city, district, isDefault },
  });

  return { success: true };
}

export async function deleteAddress(id: string) {
  const session = await getSession();
  if (!session) return { error: "Giriş gerekli." };

  await prisma.address.deleteMany({
    where: { id, userId: session.userId },
  });

  return { success: true };
}

export async function setDefaultAddress(id: string) {
  const session = await getSession();
  if (!session) return { error: "Giriş gerekli." };

  await prisma.address.updateMany({
    where: { userId: session.userId },
    data:  { isDefault: false },
  });

  const updated = await prisma.address.updateMany({
    where: { id, userId: session.userId },
    data:  { isDefault: true },
  });
  if (updated.count === 0) return { error: "Adres bulunamadı." };

  return { success: true };
}
