import { prisma } from "./lib/prisma";

async function main() {
  const orderId = "cmr1bnhex000004jwy2y3mkv7";

  // İlişkili kayıtları kontrol et
  const debt = await prisma.customerDebt.findMany({ where: { orderId } });
  console.log("CustomerDebt:", debt.length);

  // Siparişi sil (cascades items via onDelete:Cascade if set, else try manually)
  const deleted = await prisma.order.delete({ where: { id: orderId } });
  console.log("Order silindi:", deleted.orderNo);

  await prisma.$disconnect();
}
main().catch(console.error);
