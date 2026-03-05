import { useState } from "react";
import { useSmsPermission } from "../hooks/useSmsPermission";

export default function SmsAuto() {
  const {
    isCapacitor,
    hasPermission,
    isImporting,
    importProgress,
    requestPermissions,
    importInboxHistory,
  } = useSmsPermission();

  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setRequesting(true);
    await requestPermissions();
    setRequesting(false);
  };

  if (!isCapacitor) {
    return (
      <div className="space-y-4 stagger">
        <div className="hero-gradient">
          <div className="relative z-10">
            <p className="mb-2 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
              Auto SMS Parser
            </p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Android APK Required
            </h1>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              Install the Android app to enable automatic bank SMS parsing.
            </p>
          </div>
        </div>

        <div className="card text-center">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            This feature is available only in the native Android app.
          </p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="space-y-4 stagger">
        <div className="hero-gradient">
          <div className="relative z-10">
            <p className="mb-2 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
              Auto SMS Parser
            </p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Enable SMS Access
            </h1>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              Allow SMS permission to auto-log debit transaction messages.
            </p>
          </div>
        </div>

        <div className="card">
          <button onClick={handleRequestPermission} disabled={requesting} className="btn-primary w-full" type="button">
            {requesting ? "Requesting..." : "Allow SMS Access"}
          </button>
        </div>
      </div>
    );
  }

  const percent = importProgress.total > 0 ? (importProgress.done / importProgress.total) * 100 : 0;

  return (
    <div className="space-y-4 stagger">
      <div className="hero-gradient">
        <div className="relative z-10">
          <p className="mb-2 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
            Auto SMS Parser
          </p>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            SMS Detection Active
          </h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
            Incoming bank SMS messages are now monitored.
          </p>
        </div>
      </div>

      <div className="card space-y-3">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Import Last 90 Days
        </p>

        {isImporting ? (
          <div>
            <div className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
              <span>Importing...</span>
              <span>
                {importProgress.done} / {importProgress.total}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ) : (
          <button onClick={importInboxHistory} className="btn-secondary w-full" type="button">
            Import SMS History
          </button>
        )}
      </div>
    </div>
  );
}
