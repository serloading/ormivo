import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { normalizeOrderItems } from "@/lib/order-items";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Beklemede",
  CONFIRMED: "Onaylandı",
  SHIPPED:   "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};
const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Ödeme Bekliyor",
  PAID:    "Ödeme Alındı",
  FREE:    "Ücretsiz",
};
const DELIVERY_LABELS: Record<string, string> = {
  CARGO:  "Kargo",
  PICKUP: "Ofisten Teslim",
};

export default async function SiparisDetayPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const { id, source } = sp;
  if (!id || !source) notFound();

  type Item = { name: string; qty: number; price: number; productId?: string };

  let order: {
    orderNo: string; status: string; paymentStatus: string; deliveryMethod: string;
    total: number; discount: number; note: string | null; createdAt: Date;
    items: Item[];
    recipientName: string | null; recipientPhone: string | null;
    addressLine: string | null; city: string | null; district: string | null;
    trackingNo: string | null; cargoCompany: string | null;
    memberName: string | null;
  } | null = null;

  if (source === "web") {
    const raw = await prisma.siteOrder.findUnique({
      where: { id },
      include: { user: { select: { name: true, phone: true } } },
    });
    if (!raw) notFound();
    order = {
      orderNo:       raw.orderNo,
      status:        raw.status,
      paymentStatus: raw.paymentStatus ?? "PENDING",
      deliveryMethod: raw.deliveryMethod ?? "CARGO",
      total:         Number(raw.total),
      discount:      Number(raw.discount ?? 0),
      note:          raw.note,
      createdAt:     raw.createdAt,
      items:         normalizeOrderItems(raw.items),
      recipientName: raw.recipientName,
      recipientPhone: raw.recipientPhone,
      addressLine:   raw.addressLine,
      city:          raw.city,
      district:      raw.district,
      trackingNo:    raw.trackingNo,
      cargoCompany:  raw.cargoCompany,
      memberName:    raw.user?.name ?? null,
    };
  } else {
    const raw = await prisma.order.findUnique({
      where: { id },
      include: { customer: { select: { name: true, phone: true } } },
    });
    if (!raw) notFound();
    order = {
      orderNo:       raw.orderNo,
      status:        raw.status,
      paymentStatus: raw.paymentStatus ?? "PENDING",
      deliveryMethod: raw.deliveryMethod ?? "PICKUP",
      total:         Number(raw.total),
      discount:      0,
      note:          raw.note,
      createdAt:     raw.createdAt,
      items:         normalizeOrderItems(raw.items),
      recipientName: raw.customer?.name ?? "Silinmiş Müşteri",
      recipientPhone: raw.customer?.phone ?? null,
      addressLine:   null,
      city:          null,
      district:      null,
      trackingNo:    null,
      cargoCompany:  null,
      memberName:    null,
    };
  }

  const netTotal = order.total - order.discount;
  const itemTotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/siparisler" className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">← Siparişler</Link>
        <span className="text-[#d4c5ba]">/</span>
        <h2 className="text-xl font-light tracking-wide text-[#2c1810]">#{order.orderNo}</h2>
        <span className={`ml-2 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded font-medium ${source === "web" ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
          {source === "web" ? "Web" : "Manuel"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Sipariş Durumu */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-5 space-y-3">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase">Sipariş Bilgileri</h3>
          {[
            ["Sipariş No",  `#${order.orderNo}`],
            ["Tarih",       new Date(order.createdAt).toLocaleString("tr-TR")],
            ["Durum",       STATUS_LABELS[order.status] ?? order.status],
            ["Ödeme",       PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus],
            ["Teslimat",    DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod],
            ...(order.trackingNo ? [["Takip No", order.trackingNo], ["Kargo", order.cargoCompany ?? "—"]] : []),
            ...(order.note ? [["Not", order.note]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm border-b border-[#f0ebe6] pb-2 last:border-0">
              <span className="text-[#8b6f5e]">{k}</span>
              <span className="text-[#2c1810] font-medium text-right max-w-[200px]">{v}</span>
            </div>
          ))}
        </div>

        {/* Alıcı Bilgileri */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-5 space-y-3">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase">Alıcı Bilgileri</h3>
          {[
            ["Ad Soyad",  order.recipientName ?? "—"],
            ["Telefon",   order.recipientPhone ?? "—"],
            ...(order.memberName ? [["Üye Adı", order.memberName]] : []),
            ...(order.addressLine ? [["Adres", order.addressLine]] : []),
            ...(order.district || order.city ? [["Şehir", [order.district, order.city].filter(Boolean).join(", ")]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm border-b border-[#f0ebe6] pb-2 last:border-0">
              <span className="text-[#8b6f5e]">{k}</span>
              <span className="text-[#2c1810] font-medium text-right max-w-[200px]">{v}</span>
            </div>
          ))}
        </div>

        {/* Ürünler */}
        <div className="bg-white border border-[#e8ddd6] rounded-sm p-5 md:col-span-2">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">Ürünler</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0ebe6] text-xs text-[#8b6f5e] uppercase tracking-wide">
                <th className="text-left pb-2">Ürün</th>
                <th className="text-right pb-2">Adet</th>
                <th className="text-right pb-2">Birim</th>
                <th className="text-right pb-2">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-[#f0ebe6] last:border-0">
                  <td className="py-2.5 font-medium text-[#2c1810]">{item.name}</td>
                  <td className="py-2.5 text-right text-[#5c4033]">{item.qty}</td>
                  <td className="py-2.5 text-right text-[#5c4033]">{item.price.toLocaleString("tr-TR")} ₺</td>
                  <td className="py-2.5 text-right font-medium text-[#2c1810]">{(item.price * item.qty).toLocaleString("tr-TR")} ₺</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#e8ddd6]">
                <td colSpan={3} className="pt-3 text-right text-xs text-[#8b6f5e]">Ara Toplam</td>
                <td className="pt-3 text-right font-medium text-[#2c1810]">{itemTotal.toLocaleString("tr-TR")} ₺</td>
              </tr>
              {order.discount > 0 && (
                <tr>
                  <td colSpan={3} className="pt-1 text-right text-xs text-[#8b6f5e]">İskonto</td>
                  <td className="pt-1 text-right text-red-600 font-medium">−{order.discount.toLocaleString("tr-TR")} ₺</td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="pt-2 text-right text-sm font-semibold text-[#2c1810]">Genel Toplam</td>
                <td className="pt-2 text-right text-lg font-bold text-[#2c1810]">{netTotal.toLocaleString("tr-TR")} ₺</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
