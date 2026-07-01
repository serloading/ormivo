import { prisma } from "@/lib/prisma";
import { canonicalPhone, phoneLookupVariants } from "@/lib/phone";

function normalizePhone(phone: string) {
  return canonicalPhone(phone);
}

export async function syncSiteUserFromCustomerPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  const [customer, siteUser] = await Promise.all([
    prisma.customer.findFirst({
      where: { phone: { in: phoneLookupVariants(normalizedPhone) } },
      select: { name: true, segment: true },
    }),
    prisma.siteUser.findFirst({
      where: { phone: { in: phoneLookupVariants(normalizedPhone) } },
      select: { id: true, phone: true, name: true, segment: true },
    }),
  ]);

  if (!siteUser || !customer) return siteUser;

  const siteUserFull = await prisma.siteUser.findUnique({
    where: { id: siteUser.id },
    select: { id: true, phone: true, name: true, segment: true, isB2BApproved: true, isB2B: true, b2bMarkup: true },
  });
  if (!siteUserFull) return siteUser;

  const updateData: Record<string, unknown> = {};
  const customerName = customer.name?.trim();

  if ((!siteUserFull.name || !siteUserFull.name.trim()) && customerName) {
    updateData.name = customerName;
  }

  if (!siteUserFull.segment && customer.segment) {
    updateData.segment = customer.segment;
  }

  // Diamond müşteri → otomatik bayi yap
  if (customer.segment === "DIAMOND" && !siteUserFull.isB2BApproved) {
    updateData.isB2BApproved = true;
    updateData.isB2B = true;
    if (siteUserFull.b2bMarkup == null) {
      const { DEFAULT_DIAMOND_MARKUP } = await import("@/lib/segment");
      updateData.b2bMarkup = DEFAULT_DIAMOND_MARKUP;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return siteUserFull;
  }

  return prisma.siteUser.update({
    where: { id: siteUserFull.id },
    data: updateData,
    select: { id: true, phone: true, name: true, segment: true },
  });
}
