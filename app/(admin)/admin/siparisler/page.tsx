const mockOrders = [
  {
    id: "1",
    orderNo: "ORV-001",
    customer: "Ayşe Kaya",
    phone: "0532 111 2233",
    items: "Ambra Noir x1",
    total: 890,
    status: "DELIVERED",
    createdAt: "2024-01-20",
  },
  {
    id: "2",
    orderNo: "ORV-002",
    customer: "Mehmet Demir",
    phone: "0545 444 5566",
    items: "Cedar Oud x1, Rose Eternel x1",
    total: 1840,
    status: "SHIPPED",
    createdAt: "2024-02-22",
  },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Onaylandı", color: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "Kargoda", color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "İptal", color: "bg-red-100 text-red-600" },
};

export default function SiparislerPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
            Siparişler
          </h2>
          <p className="text-sm text-[#8b6f5e] mt-1">WhatsApp sipariş kayıtları</p>
        </div>
        <button className="bg-[#2c1810] text-[#f5f0eb] text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#3d2418] transition-colors">
          + Sipariş Gir
        </button>
      </div>

      <div className="bg-white border border-[#e8ddd6] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8ddd6] bg-[#faf8f6]">
              {["Sipariş No", "Müşteri", "Ürünler", "Toplam", "Durum", "Tarih", ""].map(
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
            {mockOrders.map((o, i) => {
              const s = statusLabels[o.status];
              return (
                <tr
                  key={o.id}
                  className={`border-b border-[#f0ebe6] hover:bg-[#faf8f6] ${
                    i === mockOrders.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-[#2c1810]">
                    {o.orderNo}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#2c1810]">{o.customer}</p>
                    <p className="text-xs text-[#b8a89e]">{o.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-[#5c4033] max-w-xs truncate">
                    {o.items}
                  </td>
                  <td className="px-6 py-4 text-[#2c1810] font-medium">
                    {o.total.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block text-xs px-3 py-1 rounded-full ${s.color}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#8b6f5e]">{o.createdAt}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">
                      Detay
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
