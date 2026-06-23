import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/components/site/ScrollReveal";

export const metadata: Metadata = {
  title: "Hakkımızda — Ormivo",
  description: "Ormivo'nun kuruluş felsefesi, hikayesi ve değerleri. Lüks parfüm dünyasında özgün bir deneyim.",
};

const WA = "905465402113";

const DEGERLER = [
  {
    num: "01",
    title: "Doğallık",
    desc: "Her kreasyonda doğaya saygıyı ön planda tutuyoruz. Doğal hammaddeler ve çevreye duyarlı üretim süreçleri tercihimizin temelini oluşturur.",
  },
  {
    num: "02",
    title: "Özgünlük",
    desc: "Sıradandan kaçınan, sınırlı üretim parfümleri kişiliğin en güzel ifadesidir. Koleksiyonumuzu bu anlayışla kuruyoruz.",
  },
  {
    num: "03",
    title: "Kalite",
    desc: "Dünya parfümeri evlerinden titizlikle seçilen her ürün, orijinallik sertifikasıyla güvence altına alınır.",
  },
];

const RAKAMLAR = [
  { value: "500+", label: "Mutlu Müşteri" },
  { value: "20+",  label: "Özel Formül" },
  { value: "%100", label: "Orijinal Ürün" },
];

export default function HakkimizdaPage() {
  return (
    <div className="bg-[#FAFAF7]">

      {/* ══════════════════════════════════════
          1. HERO
      ══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 min-h-[480px] md:min-h-[560px]"
        style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2D2520 50%, #1A1A1A 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#C4A882]/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-[#C4A882]/10" />
        </div>
        <span
          className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-bold leading-none text-[#C4A882]"
          style={{ fontSize: "500px", opacity: 0.04 }}
          aria-hidden
        >O</span>

        <div className="relative z-10 max-w-2xl">
          <p className="font-sans text-[10px] tracking-[0.55em] text-[#C4A882] uppercase mb-6">Ormivo</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">
            Kokunun Ardındaki<br />
            <em className="italic text-[#C4A882]">Hikaye</em>
          </h1>
          <div className="w-10 h-[1px] bg-[#C4A882] mx-auto mb-6" />
          <p className="font-sans text-[#9A9A9A] leading-relaxed text-sm md:text-base max-w-lg mx-auto">
            Parfümü salt bir koku olarak değil; kimliğin, anın ve anının ifadesi olarak görüyoruz. İşte bu inanç, Ormivo&apos;nun doğuşunu şekillendirdi.
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="w-[1px] h-8 bg-[#C4A882]/40" />
          <span className="text-[#C4A882] text-xs">↓</span>
        </div>
      </div>

      {/* ══════════════════════════════════════
          2. MİSYON QUOTE BANDI
      ══════════════════════════════════════ */}
      <ScrollReveal>
        <section className="py-20 md:py-28 px-6 bg-[#F5F0EA]">
          <div className="max-w-3xl mx-auto flex items-center gap-6 md:gap-10">
            <div className="hidden md:block w-16 h-[1px] bg-[#C4A882] shrink-0" />
            <blockquote className="text-center">
              <p className="font-serif text-xl md:text-2xl lg:text-3xl italic font-light text-[#1A1A1A] leading-relaxed">
                &ldquo;Her parfüm, sözcüklerle anlatılamayan bir duygunun ifadesidir.&rdquo;
              </p>
              <footer className="mt-6 font-sans text-[10px] tracking-[0.4em] uppercase text-[#C4A882]">
                — Ormivo Felsefesi
              </footer>
            </blockquote>
            <div className="hidden md:block w-16 h-[1px] bg-[#C4A882] shrink-0" />
          </div>
        </section>
      </ScrollReveal>

      {/* ══════════════════════════════════════
          3. HİKAYE — 2 KOLON
      ══════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">

          <ScrollReveal direction="left">
            <div>
              <p className="font-sans text-[10px] tracking-[0.5em] text-[#C4A882] uppercase mb-5">Hikayemiz</p>
              <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1A1A1A] mb-7 leading-tight">
                Lüks Parfümü<br />
                <em className="italic text-[#8B6F4E]">Herkes İçin</em>
              </h2>
              <div className="w-10 h-[1px] bg-[#C4A882] mb-7" />
              <div className="space-y-4 font-sans text-sm text-[#6B6B6B] leading-relaxed">
                <p>
                  Ormivo, dünya parfüm pazarındaki en değerli kreasyonları Türk müşterisiyle buluşturma hedefiyle kuruldu. Ekibimiz, piyasadaki binlerce ürünü mercek altına alır; yalnızca gerçekten özel olanları koleksiyonumuza dahil eder.
                </p>
                <p>
                  Her markanın arkasında yıllarca süren araştırmalar, nadide hammaddeler ve ustalaşmış parfümörler bulunur. Biz bu hikayeleri Türkiye&apos;ye taşımayı bir görev olarak görüyoruz.
                </p>
                <p>
                  Müşterilerimize en iyi deneyimi sunmak için kişisel danışmanlık hizmeti veriyoruz. WhatsApp üzerinden ulaşmanız yeterli; koku kişiliğinizi anlayıp size özel öneri sunuyoruz.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="relative">
              <div
                className="relative overflow-hidden bg-gradient-to-br from-[#E8E0D4] to-[#D4C4B0] flex items-center justify-center"
                style={{ aspectRatio: "4/5" }}
              >
                <svg viewBox="0 0 300 360" className="w-48 h-auto text-[#8B6F4E]" fill="none">
                  <rect x="110" y="14" width="80" height="30" rx="6" fill="currentColor" opacity="0.2" />
                  <rect x="125" y="4" width="50" height="18" rx="3" fill="currentColor" opacity="0.35" />
                  <path d="M60 50 Q60 40 80 40 H220 Q240 40 240 50 L265 330 Q265 345 250 345 H50 Q35 345 35 330 Z" fill="currentColor" opacity="0.1" />
                  <path d="M60 50 Q60 40 80 40 H220 Q240 40 240 50 L265 330 Q265 345 250 345 H50 Q35 345 35 330 Z" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                  <rect x="90" y="155" width="120" height="90" rx="2" fill="white" opacity="0.55" />
                  <text x="150" y="195" textAnchor="middle" style={{ font: "bold 18px serif", fill: "#8B6F4E", opacity: 0.9 }}>ORMIVO</text>
                  <text x="150" y="218" textAnchor="middle" style={{ font: "11px sans-serif", fill: "#8B6F4E", opacity: 0.6 }}>PARFUM</text>
                  <ellipse cx="150" cy="50" rx="82" ry="9" fill="currentColor" opacity="0.1" />
                </svg>
                <span className="absolute top-5 left-5 w-10 h-10 border-t border-l border-[#C4A882]/40" />
                <span className="absolute bottom-5 right-5 w-10 h-10 border-b border-r border-[#C4A882]/40" />
              </div>
              <div className="absolute -bottom-5 -left-5 bg-white border border-[#E8E4DE] px-6 py-4 shadow-lg hidden sm:block">
                <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#C4A882] mb-1">Koleksiyonda</p>
                <p className="font-serif text-2xl font-light text-[#1A1A1A]">494+</p>
                <p className="font-sans text-[9px] tracking-widest uppercase text-[#9A9A9A]">Seçkin Koku</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. DEĞERLER — 3 KART
      ══════════════════════════════════════ */}
      <section className="bg-[#F5F0EA] py-20 md:py-28 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-14">
              <p className="font-sans text-[10px] tracking-[0.5em] text-[#C4A882] uppercase mb-4">İlkelerimiz</p>
              <h2 className="font-serif text-4xl font-light text-[#1A1A1A]">Değerlerimiz</h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E8E4DE]">
            {DEGERLER.map(({ num, title, desc }, i) => (
              <ScrollReveal key={num} delay={i * 100}>
                <div className="bg-white p-10 md:p-12 border-b md:border-b-0 md:border-r border-[#E8E4DE] last:border-0 group hover:bg-[#FAFAF7] transition-colors duration-300">
                  <p className="font-serif text-5xl text-[#C4A882] opacity-30 mb-5 leading-none group-hover:opacity-50 transition-opacity">
                    {num}
                  </p>
                  <h3 className="font-sans text-[11px] tracking-[0.25em] uppercase text-[#1A1A1A] mb-4">{title}</h3>
                  <p className="font-sans text-sm text-[#6B6B6B] leading-relaxed">{desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. RAKAMLAR — KOYU BANT
      ══════════════════════════════════════ */}
      <ScrollReveal>
        <section className="bg-[#1A1A1A] py-20 px-4 md:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center divide-x divide-[#2D2D2D]">
            {RAKAMLAR.map(({ value, label }) => (
              <div key={label} className="px-4 md:px-10">
                <p className="font-serif text-4xl md:text-5xl text-[#C4A882] mb-3">{value}</p>
                <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#6B6B6B]">{label}</p>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ══════════════════════════════════════
          6. İLETİŞİM CTA
      ══════════════════════════════════════ */}
      <ScrollReveal>
        <section className="py-20 md:py-28 px-6 text-center bg-[#FAFAF7]">
          <p className="font-sans text-[10px] tracking-[0.5em] text-[#C4A882] uppercase mb-5">İletişim</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[#1A1A1A] mb-4">
            Sorunuz mu var?
          </h2>
          <p className="font-sans text-[#6B6B6B] text-sm mb-10 max-w-sm mx-auto">
            Parfüm seçiminden siparişe kadar her konuda yanınızdayız.
          </p>
          <a
            href={`https://wa.me/${WA}?text=${encodeURIComponent("Merhaba, bilgi almak istiyorum.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] text-white font-sans text-[11px] tracking-[0.3em] uppercase px-10 py-5 hover:bg-[#1da851] transition-colors duration-300 shadow-lg shadow-[#25D366]/20"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            +90 546 540 2113
          </a>
          <div className="mt-8">
            <Link
              href="/iletisim"
              className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#9A9A9A] hover:text-[#1A1A1A] border-b border-[#E8E4DE] hover:border-[#1A1A1A] pb-0.5 transition-colors"
            >
              İletişim Formu için Tıklayın
            </Link>
          </div>
        </section>
      </ScrollReveal>

    </div>
  );
}
