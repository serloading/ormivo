import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getCart } from "@/lib/actions/cart";
import CartItemRow from "@/components/site/CartItemRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sepetim — Ormivo" };

const WA = "905465402113";

export default async function SepetPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-[#FAFAF7]">
        <p className="font-serif text-4xl text-[#C4A882] opacity-30 mb-6">◈</p>
        <h1 className="font-serif text-2xl text-[#1A1A1A] mb-3">Sepetinizi görmek için giriş yapın</h1>
        <p className="font-sans text-sm text-[#9A9A9A] mb-8">Ürün eklemek ve siparişlerinizi yönetmek için hesabınıza giriş yapın.</p>
        <div className="flex gap-3">
          <Link href="/giris" className="font-sans text-[11px] tracking-[0.25em] uppercase bg-[#1A1A1A] text-white px-8 py-3 hover:bg-[#C4A882] transition-colors">
            Giriş Yap
          </Link>
          <Link href="/kayit" className="font-sans text-[11px] tracking-[0.25em] uppercase border border-[#1A1A1A] text-[#1A1A1A] px-8 py-3 hover:bg-[#1A1A1A] hover:text-white transition-colors">
            Kayıt Ol
          </Link>
        </div>
      </div>
    );
  }

  const cart = await getCart();
  const items = cart?.items ?? [];
  const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  const waText = encodeURIComponent(
    `Merhaba, sipariş vermek istiyorum:\n` +
    items.map((i) => `- ${i.product.name} x${i.quantity} (${(Number(i.product.price) * i.quantity).toLocaleString("tr-TR")} ₺)`).join("\n") +
    `\nToplam: ${total.toLocaleString("tr-TR")} ₺`
  );

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <h1 className="font-serif text-3xl text-[#1A1A1A] mb-1">Sepetim</h1>
        <p className="font-sans text-sm text-[#9A9A9A] mb-8">Merhaba {session.name}</p>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#E8E4DE] bg-white">
            <p className="font-serif text-5xl text-[#C4A882] opacity-20 mb-5">◈</p>
            <h2 className="font-serif text-xl text-[#1A1A1A] mb-2">Sepetiniz boş</h2>
            <p className="font-sans text-sm text-[#9A9A9A] mb-6">Beğendiğiniz ürünleri ekleyin.</p>
            <Link href="/" className="font-sans text-[11px] tracking-[0.25em] uppercase border border-[#1A1A1A] text-[#1A1A1A] px-8 py-3 hover:bg-[#1A1A1A] hover:text-white transition-colors">
              Alışverişe Devam Et
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Ürün listesi */}
            <div className="md:col-span-2 space-y-3">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>

            {/* Özet */}
            <div className="md:col-span-1">
              <div className="bg-white border border-[#E8E4DE] p-6 sticky top-24">
                <h2 className="font-serif text-lg text-[#1A1A1A] mb-5 pb-4 border-b border-[#E8E4DE]">
                  Sipariş Özeti
                </h2>
                <div className="space-y-2 mb-5">
                  {items.map((i) => (
                    <div key={i.id} className="flex justify-between font-sans text-xs text-[#6B6B6B]">
                      <span className="truncate pr-2">{i.product.name} ×{i.quantity}</span>
                      <span className="shrink-0">{(Number(i.product.price) * i.quantity).toLocaleString("tr-TR")} ₺</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#E8E4DE] pt-4 mb-6 flex justify-between font-sans text-sm font-semibold text-[#1A1A1A]">
                  <span>Toplam</span>
                  <span>{total.toLocaleString("tr-TR")} ₺</span>
                </div>
                <a
                  href={`https://wa.me/${WA}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-sans text-[11px] tracking-[0.2em] uppercase py-3 hover:bg-[#1DA851] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp ile Sipariş Ver
                </a>
                <Link href="/" className="block text-center font-sans text-[10px] tracking-[0.2em] uppercase text-[#9A9A9A] hover:text-[#1A1A1A] mt-4 transition-colors">
                  Alışverişe Devam Et
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
