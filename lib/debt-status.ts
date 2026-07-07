export function calcDebtStatus(paid: number, total: number): string {
  if (paid <= 0) return "BEKLIYOR";
  if (paid >= total) return "ODENDI";
  return "KISMI";
}

export function debtStatusToPaymentStatus(status: string): string {
  if (status === "ODENDI") return "PAID";
  if (status === "KISMI") return "PARTIAL";
  return "PENDING";
}
