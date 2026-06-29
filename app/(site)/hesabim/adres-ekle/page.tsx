import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdresEkleForm from "./AdresEkleForm";

export const dynamic = "force-dynamic";

export default async function AdresEklePage() {
  const session = await getSession();
  if (!session) redirect("/giris");

  const addressCount = await prisma.address.count({ where: { userId: session.userId } });
  const isFirst = addressCount === 0;

  return (
    <AdresEkleForm
      defaultName={isFirst ? (session.name ?? "") : ""}
      defaultPhone={isFirst ? (session.phone ?? "") : ""}
      isFirst={isFirst}
    />
  );
}
