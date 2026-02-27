import { useEffect, useState } from "react";

type BackendStatusDetail = {
  online: boolean;
  message?: string;
  at: number;
};

const BackendStatusBanner = () => {
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);

  useEffect(() => {
    const onBackendStatus = (event: Event) => {
      const custom = event as CustomEvent<BackendStatusDetail>;
      if (custom.detail?.online) {
        setOfflineMessage(null);
        return;
      }
      setOfflineMessage(
        custom.detail?.message ||
          "Backend offline. Start server on http://localhost:5000."
      );
    };

    window.addEventListener("sea:backend-status", onBackendStatus as EventListener);
    return () =>
      window.removeEventListener(
        "sea:backend-status",
        onBackendStatus as EventListener
      );
  }, []);

  if (!offlineMessage) return null;

  return (
    <div className="fixed left-1/2 top-3 z-[1000] w-[calc(100%-24px)] max-w-2xl -translate-x-1/2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg">
      {offlineMessage}
    </div>
  );
};

export default BackendStatusBanner;

