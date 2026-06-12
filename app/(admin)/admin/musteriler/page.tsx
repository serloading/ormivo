const mockCustomers = [
  {
    id: "1",
    name: "Ayşe Kaya",
    phone: "0532 111 2233",
    city: "İstanbul",
    orders: 3,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Mehmet Demir",
    phone: "0545 444 5566",
    city: "Ankara",
    orders: 1,
    createdAt: "2024-02-20",
  },
];

export default function MusterilerPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
            Müşteriler
          </h2>
          <p className="text-sm text-[#8b6f5e] mt-1">
            {mockCustomers.length} kayıtlı müşteri
          </p>
        </div>
        <button className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
          + Müşteri Ekle
        </button>
      </div>

      {/* Arama */}
      <div className="bg-white border border-[#e8ddd6] rounded-sm p-4 mb-6">
        <input
          type="text"
          placeholder="İsim veya telefon ara..."
          className="w-full border border-[#d4c5ba] rounded-sm px-3 py-2 text-sm text-[#2c1810] placeholder-[#b8a89e] focus:outline-none focus:border-[#8b6f5e] bg-[#faf8f6]"
        />
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Ad Soyad", "Telefon", "Şehir", "Sipariş", "Kayıt Tarihi", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {mockCustomers.map((c, i) => (
              <tr
                key={c.id}
                className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${
                  i === mockCustomers.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-6 py-4 font-medium text-[#2c1810]">
                  {c.name}
                </td>
                <td className="px-6 py-4 text-[#5c4033]">{c.phone}</td>
                <td className="px-6 py-4 text-[#5c4033]">{c.city}</td>
                <td className="px-6 py-4 text-[#5c4033]">{c.orders} sipariş</td>
                <td className="px-6 py-4 text-[#8b6f5e]">{c.createdAt}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">
                    Detay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
