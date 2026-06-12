import KargoClient from "@/components/admin/KargoClient";
import { getCargos } from "@/lib/actions/cargo";

export default async function KargoPage() {
  const cargos = await getCargos();
  return <KargoClient cargos={cargos as never} />;
}
