"use client";

import { normalizeOrderItems } from "@/lib/order-items";

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Hazırlanıyor",
  CONFIRMED: "Onaylandı",
  SHIPPED:   "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};

function toWaPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("90")) return d;
  if (d.startsWith("0"))  return "9" + d;
  return "90" + d;
}

interface OrderRow {
  id: string;
  orderNo: string;
  createdAt: Date | string;
  status: string;
  items: unknown;
  total: unknown;
  discount: unknown;
  trackingNo: string | null;
  cargoCompany: string | null;
}

interface Props {
  orders: OrderRow[];
  userPhone: string;
}

export default function HesabimSiparisler({ orders, userPhone }: Props) {
  const waPhone = toWaPhone(userPhone);

  return (
    <div className="bg-white border border-[#E8E4DE] p-5">
      <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#C4A882] mb-5">Siparişlerim</h2>
      {orders.length === 0 ? (
        <p className="font-sans text-sm text-[#9A9A9A] py-8 text-center">Henüz siparişiniz bulunmuyor.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const itemsArr = normalizeOrderItems(order.items);
            const net      = Number(order.total);
            const discount = Number(order.discount ?? 0);
            const gross    = Math.max(0, net + discount);

            // WhatsApp mesajı
            const lines = [
              `Sipariş Özetim — #${order.orderNo}`,
              ``,
              ...itemsArr.map((i) => `• ${i.name} ×${i.qty} = ${(i.price * i.qty).toLocaleString("tr-TR")} ₺`),
              ``,
              `Ana tutar: ${gross.toLocaleString("tr-TR")} ₺`,
              ...(discount > 0 ? [`Aldığı indirim: -${discount.toLocaleString("tr-TR")} ₺`] : []),
              `Son ödeyeceği: ${net.toLocaleString("tr-TR")} ₺`,
              `Durum: ${STATUS_LABELS[order.status] ?? order.status}`,
            ];
            const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(lines.join("\n"))}`;

            return (
              <div key={order.id} className="border border-[#E8E4DE] p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-sans text-[10px] text-[#9A9A9A] mb-0.5">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="font-sans text-[10px] tracking-widest text-[#6B6B6B]">#{order.orderNo}</p>
                  </div>
                  <span className={`font-sans text-[9px] tracking-[0.15em] uppercase px-2 py-1 shrink-0 ${
                    order.status === "DELIVERED" ? "bg-green-50 text-green-700" :
                    order.status === "SHIPPED"   ? "bg-blue-50 text-blue-700"   :
                    order.status === "CANCELLED" ? "bg-red-50 text-red-600"     :
                                                   "bg-[#EDE5D8] text-[#C4A882]"
                  }`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  {itemsArr.map((item, idx) => (
                    <div key={idx} className="flex justify-between font-sans text-xs">
                      <span className="text-[#6B6B6B]">{item.name} <span className="text-[#9A9A9A]">×{item.qty}</span></span>
                      <span className="text-[#4A4A4A] shrink-0 ml-2">{(item.price * item.qty).toLocaleString("tr-TR")} ₺</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#E8E4DE] pt-3 mb-3 space-y-1">
                  <div className="flex justify-between font-sans text-xs text-[#9A9A9A]">
                    <span>Ana tutar</span>
                    <span>{gross.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between font-sans text-xs text-orange-600">
                      <span>Aldığı indirim</span>
                      <span>-{discount.toLocaleString("tr-TR")} ₺</span>
                    </div>
                  )}
                  <div className="flex justify-between font-sans text-sm font-semibold text-[#1A1A1A]">
                    <span>Son ödeyeceği</span>
                    <span className="text-[#C4A882]">{net.toLocaleString("tr-TR")} ₺</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0">
                  {order.trackingNo ? (
                    <div className="font-sans text-[10px]">
                      <p className="text-[#9A9A9A] tracking-wide">Kargo Takip</p>
                      <p className="text-[#1A1A1A] font-semibold tracking-widest">{order.trackingNo}</p>
                      {order.cargoCompany && <p className="text-[#9A9A9A]">{order.cargoCompany}</p>}
                    </div>
                  ) : <div />}
                  {/* WhatsApp sipariş özeti butonu */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white px-3 py-1.5 rounded-full hover:bg-[#1ebe5d] transition-colors shrink-0"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="font-sans text-[10px] tracking-wide whitespace-nowrap">Özetimi Gönder</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
