export function normalizePhoneDigits(phone: string) {
  return phone.trim().replace(/\D/g, "");
}

export function canonicalPhone(phone: string) {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return "";
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `90${digits.slice(1)}`;
  if (digits.length === 10) return `90${digits}`;
  return digits;
}

export function phoneLookupVariants(phone: string) {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return [];

  const canonical = canonicalPhone(digits);
  const variants = new Set<string>([digits, canonical]);

  if (digits.startsWith("90") && digits.length > 2) variants.add(digits.slice(2));
  if (digits.startsWith("0") && digits.length > 1) variants.add(digits.slice(1));
  // + prefix variants — bazı müşteriler +905XX formatında kayıtlı
  if (canonical) variants.add(`+${canonical}`);
  if (canonical?.startsWith("90")) variants.add(`+${canonical.slice(2)}`);

  return [...variants].filter(Boolean);
}
