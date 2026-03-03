import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import CommandPalette from "../components/CommandPalette";
import NotificationBanner from "../components/NotificationBanner";
import InstallPrompt from "../components/InstallPrompt";
import UpdatePrompt from "../components/UpdatePrompt";
import OfflineBanner from "../components/OfflineBanner";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content - offset by sidebar on desktop */}
      <div className="lg:pl-72">
        <Navbar onOpenMenu={() => setSidebarOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
        <main id="main-content" className="px-4 py-5 pb-24 md:px-6 md:py-6 lg:pb-8 lg:px-8">
          <OfflineBanner />
          <InstallPrompt />
          <NotificationBanner />
          <Outlet />
        </main>
      </div>

      {/* Bottom nav - mobile only */}
      <BottomNav />
      <UpdatePrompt />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default DashboardLayout;
