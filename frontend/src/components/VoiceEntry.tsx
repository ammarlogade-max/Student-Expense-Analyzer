import { useCallback, useEffect, useRef, useState } from "react";
import { addCashExpenseFromVoice } from "../lib/api";
import { useToast } from "../context/ToastContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type VoiceState = "idle" | "requesting" | "listening" | "processing" | "confirming" | "saving";

interface ParsedResult {
  amount: number;
  category: string;
  description: string;
}

// ─── Category config ──────────────────────────────────────────────────────────
const catEmoji: Record<string, string> = {
  Food: "🍔", Shopping: "🛍️", Travel: "🚗", Transport: "🚇",
  Health: "💊", Entertainment: "🎬", Groceries: "🛒", Education: "📚",
  Housing: "🏠", Other: "📦"
};

// ─── Example phrases shown to user ───────────────────────────────────────────
const EXAMPLES = [
  "spent 150 on lunch",
  "paid 80 for auto rickshaw",
  "spent 500 on groceries",
  "paid 200 for medicines",
  "spent 300 on Swiggy",
];

// ─── Mic waveform animation ───────────────────────────────────────────────────
const MicWave = ({ active }: { active: boolean }) => (
  <div className="flex items-center justify-center gap-[3px] h-8">
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <div
        key={i}
        className="w-1 rounded-full transition-all"
        style={{
          background: active ? "var(--lime)" : "rgba(255,255,255,0.2)",
          height: active ? `${8 + Math.sin(i * 1.2) * 12 + 10}px` : "4px",
          animation: active ? `wave ${0.8 + i * 0.1}s ease-in-out infinite alternate` : "none",
          animationDelay: `${i * 0.08}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes wave {
        0%   { height: 4px; }
        100% { height: ${28}px; }
      }
    `}</style>
  </div>
);

// ─── Main VoiceEntry Component ────────────────────────────────────────────────
interface VoiceEntryProps {
  onSaved: () => void; // called after successful save so parent can refresh
}

export const VoiceEntry = ({ onSaved }: VoiceEntryProps) => {
  const { push } = useToast();
  const recognitionRef = useRef<any>(null);
  const exampleRef = useRef(0);

  const [state, setState] = useState<VoiceState>("idle");
  const [liveText, setLiveText] = useState(""); // interim (while speaking)
  const [finalText, setFinalText] = useState(""); // confirmed transcript
  const [parsed, setParsed] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [currentExample, setCurrentExample] = useState(0);

  // Cycle through example phrases every 3s when idle
  useEffect(() => {
    if (state !== "idle") return;
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [state]);

  // Check browser support
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(Boolean(SR));
  }, []);

  // ── Stop any active recognition ──────────────────────────────────────────
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopRecognition(), [stopRecognition]);

  // ── Start recording ──────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    setError(null);
    setLiveText("");
    setFinalText("");
    setParsed(null);

    // Check support
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    // Request mic permission explicitly so we can show a friendly error
    setState("requesting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState("idle");
      setError("Microphone permission denied. Please allow mic access in your browser settings.");
      return;
    }

    // Set up recognition
    const recognition = new SR();
    recognitionRef.current = recognition;

    recognition.lang = "en-IN";           // Indian English
    recognition.continuous = true;         // keep listening until we stop
    recognition.interimResults = true;     // show words as they're spoken
    recognition.maxAlternatives = 1;

    setState("listening");

    // Show interim results (live transcript while speaking)
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setFinalText((prev) => (prev + " " + final).trim());
        setLiveText("");
      } else {
        setLiveText(interim);
      }
    };

    recognition.onerror = (event: any) => {
      stopRecognition();
      setState("idle");
      if (event.error === "not-allowed") {
        setError("Microphone blocked. Check browser permissions.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Tap mic and speak clearly.");
      } else if (event.error !== "aborted") {
        setError(`Mic error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Only transition if we were actively listening (not manually stopped)
      setState((prev) => {
        if (prev === "listening") return "processing";
        return prev;
      });
    };

    recognition.start();
  }, [stopRecognition]);

  // ── Stop recording and process ───────────────────────────────────────────
  const stopListening = useCallback(() => {
    stopRecognition();
    setState("processing");
  }, [stopRecognition]);

  // ── When we enter "processing", send transcript to backend ───────────────
  useEffect(() => {
    if (state !== "processing") return;

    const transcript = finalText.trim();
    if (!transcript) {
      setState("idle");
      setError("Nothing was captured. Try speaking more clearly and closer to the mic.");
      return;
    }

    // Call the backend to parse the transcript
    (async () => {
      try {
        const res = await addCashExpenseFromVoice(transcript);
        // Backend parsed it — show confirmation step
        setParsed({
          amount: res.parsed.amount,
          category: res.parsed.category,
          description: res.parsed.description
        });
        setState("confirming");
      } catch (err: any) {
        setState("idle");
        setError(err.message || "Could not parse your statement. Try: 'spent 150 on food'");
      }
    })();
  }, [state, finalText]);

  // ── Confirm and save ─────────────────────────────────────────────────────
  // Note: at "confirming" state, the expense is ALREADY saved by the backend
  // (addCashExpenseFromVoice saves it). We just confirm to the user.
  const confirmSave = useCallback(() => {
    setState("idle");
    setFinalText("");
    setLiveText("");
    setError(null);
    push("Cash expense saved via voice ✓", "success");
    onSaved();
  }, [onSaved, push]);

  // ── Cancel / retry ───────────────────────────────────────────────────────
  const reset = useCallback(() => {
    stopRecognition();
    setState("idle");
    setFinalText("");
    setLiveText("");
    setParsed(null);
    setError(null);
  }, [stopRecognition]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (!supported) {
    return (
      <div
        className="rounded-2xl p-4 text-sm"
        style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--rose)" }}
      >
        <p className="font-semibold mb-1">Voice not supported</p>
        <p style={{ color: "var(--text-muted)" }}>
          Voice entry requires Chrome or Edge browser. You can still type expenses manually above.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>
            🎤 Voice Entry
          </h4>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Speak naturally — AI understands you
          </p>
        </div>
        {state !== "idle" && (
          <button onClick={reset} className="btn-ghost px-3 py-1.5 text-xs">
            Cancel
          </button>
        )}
      </div>

      {/* ── Idle: big mic button ─────────────────────────────────────── */}
      {state === "idle" && (
        <div className="text-center">
          {/* Animated example phrase */}
          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm animate-fade-in"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-muted)" }}
          >
            Try: <span style={{ color: "var(--text)" }}>"{EXAMPLES[currentExample]}"</span>
          </div>

          {/* Big mic button */}
          <button
            onClick={startListening}
            className="relative mx-auto flex w-full max-w-xs flex-col items-center gap-3 group rounded-2xl py-2"
            style={{ minHeight: 44 }}
          >
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95"
              style={{
                background: "linear-gradient(135deg, rgba(200,255,0,0.15), rgba(200,255,0,0.05))",
                border: "2px solid rgba(200,255,0,0.3)",
                boxShadow: "0 0 30px rgba(200,255,0,0.1)"
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" style={{ color: "var(--lime)" }}>
                <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 19v3M9 22h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--lime)" }}
            >
              Tap to speak
            </span>
          </button>

          {error && (
            <div
              className="mt-4 px-4 py-3 rounded-xl text-sm text-left"
              style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--rose)" }}
            >
              {error}
            </div>
          )}
        </div>
      )}

      {/* ── Requesting permission ────────────────────────────────────── */}
      {state === "requesting" && (
        <div className="text-center py-6">
          <div
            className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-3"
            style={{ background: "rgba(255,185,48,0.1)", border: "1px solid rgba(255,185,48,0.25)" }}
          >
            <span className="text-2xl animate-float">🎙️</span>
          </div>
          <p className="text-sm font-semibold">Allow microphone access</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Click "Allow" in the browser popup
          </p>
        </div>
      )}

      {/* ── Listening: live waveform + transcript ────────────────────── */}
      {state === "listening" && (
        <div>
          {/* Pulsing mic */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative">
              {/* Pulse rings */}
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: "rgba(200,255,0,0.12)", animationDuration: "1.2s" }}
              />
              <div
                className="absolute inset-[-8px] rounded-full animate-ping"
                style={{ background: "rgba(200,255,0,0.06)", animationDuration: "1.6s", animationDelay: "0.3s" }}
              />
              <div
                className="relative h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(200,255,0,0.15)",
                  border: "2px solid var(--lime)",
                  boxShadow: "0 0 20px rgba(200,255,0,0.3)"
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" style={{ color: "var(--lime)" }}>
                  <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M12 19v3M9 22h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="live-dot" />
              <span className="text-sm font-semibold" style={{ color: "var(--lime)" }}>
                Listening...
              </span>
            </div>
          </div>

          {/* Waveform */}
          <MicWave active />

          {/* Live transcript area */}
          <div
            className="mt-4 min-h-[60px] rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {finalText || liveText ? (
              <p className="text-sm leading-relaxed">
                <span style={{ color: "var(--text)" }}>{finalText}</span>
                {liveText && (
                  <span style={{ color: "var(--text-muted)" }}> {liveText}</span>
                )}
              </p>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Speak now... say something like "spent 150 on food"
              </p>
            )}
          </div>

          {/* Stop button */}
          <button
            onClick={stopListening}
            className="btn-primary w-full mt-4"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
            Done — process this
          </button>
        </div>
      )}

      {/* ── Processing: spinner ──────────────────────────────────────── */}
      {state === "processing" && (
        <div className="text-center py-8">
          <div
            className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4"
            style={{ border: "2px solid rgba(200,255,0,0.15)" }}
          >
            <svg
              className="h-8 w-8 animate-spin"
              viewBox="0 0 24 24" fill="none"
              style={{ color: "var(--lime)" }}
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity=".2"/>
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <p className="text-sm font-semibold">Processing with AI...</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Extracting amount, category, and details
          </p>

          {/* Show what was captured */}
          {finalText && (
            <div
              className="mt-4 px-4 py-3 rounded-xl text-sm text-left"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Captured</p>
              <p>"{finalText}"</p>
            </div>
          )}
        </div>
      )}

      {/* ── Confirming: show parsed result ──────────────────────────── */}
      {state === "confirming" && parsed && (
        <div className="animate-scale-in">
          {/* Success header */}
          <div className="flex items-center gap-2 mb-5">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(200,255,0,0.15)", color: "var(--lime)" }}
            >
              ✓
            </div>
            <div>
              <p className="text-sm font-semibold">AI understood you!</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Review before saving</p>
            </div>
          </div>

          {/* What was heard */}
          <div
            className="mb-4 px-3 py-2 rounded-lg text-xs"
            style={{ background: "rgba(255,255,255,0.03)", color: "var(--text-muted)" }}
          >
            Heard: "{finalText}"
          </div>

          {/* Parsed result card */}
          <div
            className="rounded-2xl p-5 mb-4"
            style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.15)" }}
          >
            {/* Amount — big and bold */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Amount</p>
                <p className="text-4xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--lime)" }}>
                  ₹{parsed.amount}
                </p>
              </div>
              <div className="text-4xl">{catEmoji[parsed.category] || "📦"}</div>
            </div>

            {/* Category */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Category</p>
                <p className="text-sm font-semibold">{parsed.category}</p>
              </div>
              <div
                className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Description</p>
                <p className="text-sm font-semibold truncate">{parsed.description}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={reset} className="btn-ghost">
              🔄 Retry
            </button>
            <button onClick={confirmSave} className="btn-primary">
              ✓ Confirm & Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceEntry;
