/**
 * /notification-voice
 *
 * Tiny popup page opened when the user taps 🎤 Speak
 * on the 8 PM evening reminder notification.
 *
 * Flow:
 *   1. Page loads → mic activates automatically
 *   2. User speaks: "Spent 120 on snacks"
 *   3. Web Speech API transcribes in real time
 *   4. User taps Send → POST /api/notifications/action
 *   5. Backend logs the expense, sends confirmation notification
 *   6. Window closes
 */

import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

type Status = "idle" | "listening" | "processing" | "done" | "error" | "unsupported";

const NotificationVoice = () => {
  const [status, setStatus]         = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult]         = useState<{ amount?: number; category?: string } | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const recognitionRef              = useRef<any>(null);

  // ── Start mic immediately on mount ──────────────────────────────────────────
  useEffect(() => {
    startListening();
    return () => recognitionRef.current?.abort();
  }, []);

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("unsupported");
      return;
    }

    const recognition       = new SpeechRecognition();
    recognition.lang        = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current  = recognition;

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event: any) => {
      const t = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join(" ");
      setTranscript(t);
    };

    recognition.onerror = () => setStatus("error");
    recognition.onend   = () => {
      if (status !== "processing" && status !== "done") setStatus("idle");
    };

    recognition.start();
  }

  async function handleSend() {
    if (!transcript.trim()) return;
    setStatus("processing");
    recognitionRef.current?.abort();

    try {
      const token = localStorage.getItem("expenseiq_token");
      const res   = await fetch(`${API_BASE}/notifications/action`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "voice_entry", text: transcript }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data.expense);
        setStatus("done");
        // Auto-close after 2.5s
        setTimeout(() => window.close(), 2500);
      } else {
        setError(data.error || "Couldn't parse that. Try again.");
        setStatus("error");
      }
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
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

      {/* Status indicator */}
      {status === "listening" && (
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background:"rgba(99,102,241,0.2)", animationDuration:"1.5s" }}/>
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background:"rgba(99,102,241,0.15)", animationDuration:"2s", animationDelay:"0.5s" }}/>
            {/* Mic button */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background:"var(--gradient-primary)", boxShadow:"0 0 40px rgba(99,102,241,0.4)" }}>
              <svg viewBox="0 0 24 24" className="h-9 w-9 text-white" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </div>
          </div>
          <p className="text-sm font-semibold" style={{ color:"var(--primary)" }}>Listening…</p>
          <p className="text-xs mt-1" style={{ color:"var(--text-tertiary)" }}>Say: "Spent 120 on snacks"</p>
        </div>
      )}

      {status === "idle" && (
        <button onClick={startListening}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full transition hover:scale-105"
          style={{ background:"var(--bg-secondary)", border:"2px solid var(--border-medium)" }}>
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor" style={{ color:"var(--text-secondary)" }}>
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
      )}

      {status === "done" && result && (
        <div className="mb-6 flex flex-col items-center">
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
      )}

      {status === "unsupported" && (
        <p className="mb-6 text-sm text-center" style={{ color:"var(--error)" }}>
          Your browser doesn't support voice input.<br/>Please type your expense instead.
        </p>
      )}

      {/* Transcript box */}
      {(status === "listening" || status === "idle") && transcript && (
        <div className="w-full max-w-xs mb-4 rounded-xl px-4 py-3 text-sm text-center"
          style={{ background:"var(--bg-secondary)", border:"1px solid var(--border-medium)", color:"var(--text-primary)" }}>
          "{transcript}"
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mb-4 text-sm text-center" style={{ color:"var(--error)" }}>{error}</p>
      )}

      {/* Actions */}
      {(status === "listening" || status === "idle") && (
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => window.close()} className="btn-secondary flex-1 !py-3 text-sm">
            Cancel
          </button>
          <button onClick={handleSend} disabled={!transcript.trim()} className="btn-primary flex-1 !py-3 text-sm">
            Send →
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => window.close()} className="btn-secondary flex-1 !py-3 text-sm">Cancel</button>
          <button onClick={() => { setStatus("idle"); setTranscript(""); setError(null); startListening(); }}
            className="btn-primary flex-1 !py-3 text-sm">Retry</button>
        </div>
      )}
    </div>
  );
};

export default NotificationVoice;
