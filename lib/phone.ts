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

  const canonical = canonicalPhone(digits);  // 905XXXXXXXXX
  const variants = new Set<string>([digits, canonical]);

  // 905XXXXXXXXX → 5XXXXXXXXX ve 05XXXXXXXXX
  if (canonical.startsWith("90") && canonical.length === 12) {
    variants.add(canonical.slice(2));       // 5XXXXXXXXX
    variants.add(`0${canonical.slice(2)}`); // 05XXXXXXXXX
  }
  // 0XXXXXXXXX → XXXXXXXXX
  if (digits.startsWith("0") && digits.length > 1) variants.add(digits.slice(1));
  // +90 prefix varyantları
  if (canonical) variants.add(`+${canonical}`);
  if (canonical.startsWith("90")) variants.add(`+${canonical.slice(2)}`);

  return [...variants].filter(Boolean);
}
