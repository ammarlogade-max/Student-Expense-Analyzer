import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import CommandPalette from "../components/CommandPalette";
import NotificationBanner from "../components/NotificationBanner";
import InstallPrompt from "../components/InstallPrompt";
import UpdatePrompt from "../components/UpdatePrompt";
import OfflineBanner from "../components/OfflineBanner";

const DashboardLayout = () => {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }

      if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
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
          className="px-4 py-5 pb-28 md:px-6 md:py-6 lg:px-8 lg:pb-10"
        >
          <div className="space-y-4">
            <OfflineBanner />
            <InstallPrompt />
            <NotificationBanner />
          </div>

          <div className="mt-4">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
      <UpdatePrompt />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
