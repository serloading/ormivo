import SiparislerClient from "@/components/admin/SiparislerClient";
import { getOrders } from "@/lib/actions/order";
import { getCustomers } from "@/lib/actions/customer";
import { getProducts } from "@/lib/actions/product";

export default async function SiparislerPage() {
  const [orders, customers, products] = await Promise.all([getOrders(), getCustomers(), getProducts()]);
  return (
    <SiparislerClient
      orders={orders as never}
      customers={customers as never}
      products={products as never}
    />
  );
}
