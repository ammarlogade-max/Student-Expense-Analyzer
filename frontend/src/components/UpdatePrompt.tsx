/**
 * UpdatePrompt — shown when a new version of the app is available
 *
 * When a new SW is deployed, existing users see this banner.
 * Tapping "Update" tells the waiting SW to skip waiting → page reloads.
 */

import { usePWA } from "../hooks/usePWA";

export default function UpdatePrompt() {
  const { swUpdateReady, updateApp } = usePWA();

  if (!swUpdateReady) return null;

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-50 lg:left-auto lg:right-6 lg:w-80 animate-fade-up"
    >
      <div
        className="flex items-center gap-3 rounded-2xl p-4 shadow-2xl"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid rgba(99,102,241,0.35)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.15)",
        }}
      >
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--gradient-primary)" }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Update available
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            A new version of ExpenseIQ is ready.
          </p>
        </div>

        <button
          onClick={updateApp}
          className="btn-primary !px-3 !py-2 text-xs !min-h-[34px] shrink-0"
        >
          Update
        </button>
      </div>
    </div>
  );
}
