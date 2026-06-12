import KategorilerClient from "@/components/admin/KategorilerClient";
import { getCategories } from "@/lib/actions/category";

export default async function KategorilerPage() {
  const categories = await getCategories();
  return <KategorilerClient categories={categories} />;
}
