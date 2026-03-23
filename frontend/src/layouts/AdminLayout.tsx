import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopbar from "../components/admin/AdminTopbar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        <AdminTopbar onOpenMenu={() => setSidebarOpen(true)} />
        <main className="px-4 py-6 md:px-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
