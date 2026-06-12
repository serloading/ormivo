export const dynamic = "force-dynamic";

import AdminSidebar from "@/components/admin/AdminSidebar";
import Breadcrumb from "@/components/admin/Breadcrumb";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#faf8f6]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 pt-20 md:pt-8">
          <Breadcrumb />
          {children}
        </div>
      </main>
    </div>
  );
}
