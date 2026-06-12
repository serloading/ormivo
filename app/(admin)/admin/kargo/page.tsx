const mockCargos = [
  {
    id: "1",
    orderNo: "ORV-001",
    customer: "Ayşe Kaya",
    company: "Yurtiçi Kargo",
    trackingNo: "YK123456789",
    status: "DELIVERED",
    updatedAt: "2024-01-22",
  },
  {
    id: "2",
    orderNo: "ORV-002",
    customer: "Mehmet Demir",
    company: "MNG Kargo",
    trackingNo: "MNG987654321",
    status: "IN_TRANSIT",
    updatedAt: "2024-02-24",
  },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  PREPARING: { label: "Hazırlanıyor", color: "bg-yellow-100 text-yellow-700" },
  SHIPPED: { label: "Kargoya Verildi", color: "bg-blue-100 text-blue-700" },
  IN_TRANSIT: { label: "Yolda", color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-100 text-green-700" },
  RETURNED: { label: "İade", color: "bg-red-100 text-red-600" },
};

export default function KargoPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
          Kargo Takibi
        </h2>
        <button className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
          + Kargo Ekle
        </button>
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {[
                "Sipariş",
                "Müşteri",
                "Kargo Firması",
                "Takip No",
                "Durum",
                "Güncelleme",
                "",
              ].map((h) => (
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
            {mockCargos.map((c, i) => {
              const s = statusLabels[c.status];
              return (
                <tr
                  key={c.id}
                  className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${
                    i === mockCargos.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-[#2c1810]">
                    {c.orderNo}
                  </td>
                  <td className="px-6 py-4 text-[#5c4033]">{c.customer}</td>
                  <td className="px-6 py-4 text-[#5c4033]">{c.company}</td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-[#f5f0eb] px-2 py-1 rounded">
                      {c.trackingNo}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${s.color}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#8b6f5e]">{c.updatedAt}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">
                      Güncelle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
