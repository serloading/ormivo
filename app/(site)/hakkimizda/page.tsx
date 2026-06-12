export const metadata = { title: "Hakkımızda — Ormivo" };

export default function HakkimizdaPage() {
  return (
    <div className="bg-[#faf8f6] min-h-screen">
      <div className="border-b border-[#e8ddd6] bg-[#f5f0eb] py-16 text-center">
        <p className="text-xs tracking-[0.5em] text-[#8b6f5e] uppercase mb-3">
          Ormivo
        </p>
        <h1 className="text-3xl font-light tracking-[0.2em] text-[#2c1810] uppercase">
          Hakkımızda
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="space-y-8 text-sm text-[#5c4033] leading-relaxed">
          <p>
            Ormivo, parfümü bir sanat formu olarak ele alan bir lüks koku markasıdır.
            Her parfümümüz, dünyanın dört bir yanından özenle seçilmiş hammaddelerle
            uzman parfümörlerimiz tarafından yaratılmaktadır.
          </p>
          <p>
            Koku, insanın en derin duygularına ve anılarına dokunan tek duygudur.
            Ormivo olarak her ürünümüzde bu derin bağı güçlendirmeyi amaçlıyoruz.
          </p>
          <p>
            Koleksiyonumuz; kadın, erkek ve unisex kategorilerinde zamansız parfümler
            ile sınırlı sayıda özel koleksiyonları kapsamaktadır.
          </p>
        </div>
      </div>
    </div>
  );
}
