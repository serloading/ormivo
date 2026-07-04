/**
 * Sipariş numarasını kısaltılmış gösterim formatına çevirir.
 * DB değeri değişmez; sadece UI gösterimi için kullanılır.
 *
 * ORV-1751234567890  →  ORV-7890
 * cm1abc2def3ghi4jkl →  4JKL (son 4 harf, büyük)
 */
export function fmtOrderNo(orderNo: string): string {
  if (!orderNo) return orderNo;

  // CRM siparişleri: ORV-<timestamp> → ORV-<son 4 rakam>
  const orvMatch = orderNo.match(/^(ORV)-(\d+)$/);
  if (orvMatch) {
    return `${orvMatch[1]}-${orvMatch[2].slice(-4)}`;
  }

  // Web siparişleri (cuid veya benzeri): son 6 karakter, büyük harf
  return orderNo.slice(-6).toUpperCase();
}
