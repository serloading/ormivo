const mockFinance = [
  {
    id: "1",
    type: "INCOME",
    description: "Ambra Noir satışı — Ayşe Kaya",
    category: "Satış",
    amount: 890,
    date: "2024-01-20",
  },
  {
    id: "2",
    type: "INCOME",
    description: "Cedar Oud + Rose Eternel — Mehmet Demir",
    category: "Satış",
    amount: 1840,
    date: "2024-02-22",
  },
  {
    id: "3",
    type: "EXPENSE",
    description: "Şişe tedariki",
    category: "Tedarik",
    amount: 450,
    date: "2024-02-01",
  },
  {
    id: "4",
    type: "EXPENSE",
    description: "Kargo masrafları",
    category: "Lojistik",
    amount: 120,
    date: "2024-02-25",
  },
];

export default function FinansPage() {
  const toplamGelir = mockFinance
    .filter((f) => f.type === "INCOME")
    .reduce((s, f) => s + f.amount, 0);

  const toplamGider = mockFinance
    .filter((f) => f.type === "EXPENSE")
    .reduce((s, f) => s + f.amount, 0);

  const netKar = toplamGelir - toplamGider;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
          Finans
        </h2>
        <button className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
          + Kayıt Ekle
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Toplam Gelir", value: toplamGelir, color: "text-green-700" },
          { label: "Toplam Gider", value: toplamGider, color: "text-red-600" },
          { label: "Net Kâr", value: netKar, color: netKar >= 0 ? "text-green-700" : "text-red-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#e8ddd6] rounded-sm p-6"
          >
            <p className="text-xs tracking-widest text-[#8b6f5e] uppercase mb-3">
              {stat.label}
            </p>
            <p className={`text-2xl font-light ${stat.color}`}>
              {stat.value.toLocaleString("tr-TR")} ₺
            </p>
          </div>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Tür", "Açıklama", "Kategori", "Tutar", "Tarih"].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-4 text-xs tracking-widest text-[#8b6f5e] uppercase font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockFinance.map((f, i) => (
              <tr
                key={f.id}
                className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${
                  i === mockFinance.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      f.type === "INCOME"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {f.type === "INCOME" ? "Gelir" : "Gider"}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#2c1810]">{f.description}</td>
                <td className="px-6 py-4 text-[#8b6f5e]">{f.category}</td>
                <td
                  className={`px-6 py-4 font-medium ${
                    f.type === "INCOME" ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {f.type === "INCOME" ? "+" : "-"}
                  {f.amount.toLocaleString("tr-TR")} ₺
                </td>
                <td className="px-6 py-4 text-[#8b6f5e]">{f.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
