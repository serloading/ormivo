import StokClient from "@/components/admin/StokClient";
import { getProducts } from "@/lib/actions/product";

export default async function StokPage() {
  const products = await getProducts();
  return <StokClient products={products as never} />;
}
