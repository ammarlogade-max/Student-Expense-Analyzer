import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CommandPalette from "../components/CommandPalette";
import MobileBottomNav from "../components/MobileBottomNav";

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
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen mesh-bg grain">
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only absolute left-4 top-4 z-50 rounded-lg px-3 py-2 text-sm"
        style={{ background: "var(--lime)", color: "#080c12" }}
      >
        Skip to content
      </a>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area shifts right on desktop to make space for sidebar */}
      <div className="lg:pl-[240px]">
        <Navbar
          onOpenMenu={() => setSidebarOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        {/* Main content */}
        <main
          id="main-content"
          className="px-4 py-6 pb-24 md:px-8 md:py-8 lg:pb-10 animate-fade-in"
        >
          <Outlet />
        </main>
      </div>

      <MobileBottomNav onOpenMore={() => setSidebarOpen(true)} />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default DashboardLayout;
