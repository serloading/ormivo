import FinansClient from "@/components/admin/FinansClient";
import { getFinanceRecords } from "@/lib/actions/finance";

export default async function FinansPage() {
  const records = await getFinanceRecords();
  return <FinansClient records={records as never} />;
}
