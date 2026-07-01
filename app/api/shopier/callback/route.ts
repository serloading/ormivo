import { NextRequest, NextResponse } from "next/server";
import { prisma }                   from "@/lib/prisma";
import { verifyShopierCallback }    from "@/lib/shopier";
import { revalidatePath }           from "next/cache";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ormivo.com";

// Shopier hem GET hem POST ile callback gönderebilir
async function handleCallback(params: Record<string, string>) {
  const { status, platform_order_id, random_nr, signature } = params;

  // İmzayı doğrula
  if (!random_nr || !platform_order_id || !status || !signature) {
    return NextResponse.redirect(`${SITE_URL}/siparis-odeme-basarisiz?hata=eksik_parametre`);
  }

  const valid = verifyShopierCallback({ random_nr, platform_order_id, status, signature });
  if (!valid) {
    return NextResponse.redirect(`${SITE_URL}/siparis-odeme-basarisiz?hata=imza`);
  }

  const orderNo = platform_order_id;

  if (status === "1") {
    // Ödeme başarılı
    const order = await prisma.siteOrder.findUnique({
      where:  { orderNo },
      select: { id: true, paymentStatus: true },
    });

    if (order && order.paymentStatus !== "PAID") {
      await prisma.siteOrder.update({
        where: { orderNo },
        data:  { paymentStatus: "PAID" },
      });
      // Eğer borç kaydı varsa onu da kapat
      await prisma.customerDebt.updateMany({
        where: { siteOrderId: order.id },
        data:  { status: "ODENDI", paidAmount: { increment: 0 } },
      });
      revalidatePath("/admin/siparisler");
      revalidatePath("/admin/borc-alacak");
      revalidatePath("/hesabim", "layout");
    }

    return NextResponse.redirect(`${SITE_URL}/siparis-tamamlandi?orderNo=${orderNo}&paid=1`);
  } else {
    // Ödeme başarısız / iptal
    return NextResponse.redirect(`${SITE_URL}/siparis-odeme-basarisiz?orderNo=${orderNo}`);
  }
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  return handleCallback(params);
}

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const params: Record<string, string> = {};
  body.forEach((v, k) => { params[k] = String(v); });
  return handleCallback(params);
}
