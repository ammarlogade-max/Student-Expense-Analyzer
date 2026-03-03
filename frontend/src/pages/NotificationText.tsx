/**
 * /notification-text
 *
 * Tiny popup opened when the user taps ✏️ Type
 * on the 8 PM evening reminder notification.
 *
 * The user types: "120 snacks" or "paid 300 for books"
 * → Backend parses and logs it silently.
 */

import { useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

const SUGGESTIONS = [
  "Spent 120 on snacks",
  "200 for lunch",
  "Auto 80",
  "300 grocery",
];

const NotificationText = () => {
  const [text, setText]         = useState("");
  const [status, setStatus]     = useState<"idle"|"processing"|"done"|"error">("idle");
  const [result, setResult]     = useState<{ amount?: number; category?: string } | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  async function handleSend() {
    if (!text.trim()) return;
    setStatus("processing");

    try {
      const token = localStorage.getItem("expenseiq_token");
      const res   = await fetch(`${API_BASE}/notifications/action`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "text_entry", text }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data.expense);
        setStatus("done");
        setTimeout(() => window.close(), 2500);
      } else {
        setError(data.error ?? "Couldn't parse. Try: '120 food' or 'spent 300 on transport'");
        setStatus("error");
      }
    } catch {
      setStatus("error");
      setError("Network error. Check your connection.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background:"var(--bg-primary)", color:"var(--text-primary)", fontFamily:"var(--font-sans)" }}>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background:"var(--gradient-primary)" }}>
          <span className="text-xs font-black text-white">IQ</span>
        </div>
        <span className="font-bold" style={{ fontFamily:"var(--font-display)" }}>ExpenseIQ</span>
      </div>

      {status === "done" && result ? (
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full mb-3"
            style={{ background:"rgba(16,185,129,0.15)", border:"2px solid rgba(16,185,129,0.4)" }}>
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="#10b981" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p className="font-bold text-lg" style={{ color:"#10b981" }}>Logged!</p>
          <p className="text-sm mt-1" style={{ color:"var(--text-secondary)" }}>
            ₹{result.amount?.toLocaleString("en-IN")} · {result.category}
          </p>
          <p className="text-xs mt-1" style={{ color:"var(--text-muted)" }}>Window closing…</p>
        </div>
      ) : (
        <>
          <p className="text-base font-semibold mb-1 text-center" style={{ color:"var(--text-primary)" }}>
            Log a cash expense
          </p>
          <p className="text-xs mb-5 text-center" style={{ color:"var(--text-tertiary)" }}>
            Type naturally — we'll figure out the rest
          </p>

          {/* Input */}
          <div className="w-full max-w-xs mb-3">
            <input
              ref={inputRef}
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="e.g. 120 snacks"
              disabled={status === "processing"}
              style={{ textAlign:"center", fontSize:18, fontWeight:600 }}
            />
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-5 w-full max-w-xs">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => { setText(s); inputRef.current?.focus(); }}
                className="cat-chip text-xs !py-1">
                {s}
              </button>
            ))}
          </div>

          {error && (
            <p className="mb-4 text-xs text-center px-2" style={{ color:"var(--error)" }}>{error}</p>
          )}

          <div className="flex gap-3 w-full max-w-xs">
            <button onClick={() => window.close()} className="btn-secondary flex-1 !py-3 text-sm">
              Cancel
            </button>
            <button onClick={handleSend} disabled={!text.trim() || status === "processing"}
              className="btn-primary flex-1 !py-3 text-sm">
              {status === "processing" ? "Logging…" : "Log it →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationText;
