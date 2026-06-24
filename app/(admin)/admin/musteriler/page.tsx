import MusterilerClient from "@/components/admin/MusterilerClient";
import { getCustomers } from "@/lib/actions/customer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Müşteriler — Admin" };

export default async function MusterilerPage() {
  const customers = await getCustomers();
  return <MusterilerClient customers={customers as never} />;
}
