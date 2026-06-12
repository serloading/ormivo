import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-[#faf8f6]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto md:ml-0">
        <div className="p-6 md:p-8 pt-20 md:pt-8">{children}</div>
      </main>
    </div>
  );
}
