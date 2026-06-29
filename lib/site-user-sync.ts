import { prisma } from "@/lib/prisma";

function normalizePhone(phone: string) {
  return phone.trim().replace(/\s/g, "");
}

export async function syncSiteUserFromCustomerPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  const [customer, siteUser] = await Promise.all([
    prisma.customer.findFirst({
      where: { phone: normalizedPhone },
      select: { name: true, segment: true },
    }),
    prisma.siteUser.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true, phone: true, name: true, segment: true },
    }),
  ]);

  if (!siteUser || !customer) return siteUser;

  const updateData: { name?: string; segment?: string | null } = {};
  const customerName = customer.name?.trim();

  if ((!siteUser.name || !siteUser.name.trim()) && customerName) {
    updateData.name = customerName;
  }

  if (!siteUser.segment && customer.segment) {
    updateData.segment = customer.segment;
  }

  if (Object.keys(updateData).length === 0) {
    return siteUser;
  }

  return prisma.siteUser.update({
    where: { id: siteUser.id },
    data: updateData,
    select: { id: true, phone: true, name: true, segment: true },
  });
}
