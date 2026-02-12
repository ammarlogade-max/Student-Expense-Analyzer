import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CommandPalette from "../components/CommandPalette";
import Breadcrumbs from "../components/Breadcrumbs";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus-ring absolute left-4 top-4 z-50 rounded bg-white px-3 py-2 text-sm"
      >
        Skip to content
      </a>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <Navbar
          onOpenMenu={() => setSidebarOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main
          id="main-content"
          className="fade-in px-4 py-6 md:px-8 lg:px-10"
        >
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default DashboardLayout;
