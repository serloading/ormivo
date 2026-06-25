import FinansClient from "@/components/admin/FinansClient";
import { getFinanceRecords } from "@/lib/actions/finance";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finans — Ormivo Admin" };

export default async function FinansPage() {
  const records = await getFinanceRecords();
  return <FinansClient records={records as never} />;
}
