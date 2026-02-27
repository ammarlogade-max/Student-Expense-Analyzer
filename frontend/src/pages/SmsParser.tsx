import { useState } from "react";
import { addExpense, ingestSms, parseSms } from "../lib/api";
import { useToast } from "../context/ToastContext";

const categories = ["Food", "Shopping", "Transport", "Housing", "Education", "Entertainment", "Health", "Other"];

const catEmoji: Record<string, string> = {
  Food: "🍔", Shopping: "🛍️", Transport: "🚇", Housing: "🏠",
  Education: "📚", Entertainment: "🎬", Health: "💊", Other: "📦"
};

const catColors: Record<string, string> = {
  Food: "#c8ff00", Shopping: "#00e5c3", Transport: "#ffb930",
  Housing: "#f97316", Education: "#60a5fa", Entertainment: "#a78bfa",
  Health: "#ff4d6d", Other: "#6b7a99"
};

// Example SMS templates to help users
const EXAMPLES = [
  "Rs. 250 debited from a/c XX1234 on 05-02-2026 to Zomato. Avl Bal: Rs. 4500.00",
  "INR 2000.00 withdrawn from ATM on 06-02-2026. Available balance: INR 8000.00",
  "Rs.150 spent on HDFC Bank Debit Card on 07-02-2026 at SWIGGY. Avl Bal: Rs.12000",
  "Your a/c XX5678 is debited for Rs. 500.00 towards UPI/Ola/07022026. Bal: Rs.3200",
];

type ParseResult = {
  amount: string | null;
  date: string | null;
  merchant: string;
  category: string;
  type?: string;
};

const SmsParser = () => {
  const { push } = useToast();
  const [smsText, setSmsText] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [showAllExamples, setShowAllExamples] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Other");
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await parseSms(smsText);
      setResult(res.result);
      const cat = res.result?.category;
      setSelectedCategory(!cat || cat === "Uncategorized" ? "Other" : cat);
    } catch (err: any) {
      setError(err.message || "Failed to parse SMS");
    } finally { setLoading(false); }
  };

  const handleIngest = async () => {
    setIngesting(true); setError(null);
    try {
      const res = await ingestSms(smsText);
      setResult(res.result);
      if (res.result.type === "cash_withdrawal") {
        push("💵 ATM withdrawal auto-recorded in cash wallet", "success");
      } else {
        push("SMS ingested as expense flow", "success");
      }
    } catch (err: any) {
      setError(err.message || "Failed to ingest SMS");
    } finally { setIngesting(false); }
  };

  const handleSaveExpense = async () => {
    if (!result?.amount) { push("Parsed amount missing", "error"); return; }
    setSaving(true);
    try {
      await addExpense({
        amount: Number(result.amount),
        category: !result.category || result.category === "Uncategorized" || !result.merchant
          ? selectedCategory : result.category,
        description: result.merchant || "SMS expense"
      });
      push("Saved to expenses ✓", "success");
    } catch (err: any) {
      push(err.message || "Failed to save", "error");
    } finally { setSaving(false); }
  };

  const needsCategorySelect = !result?.category || result.category === "Uncategorized" || !result?.merchant;
  const visibleExamples = showAllExamples ? EXAMPLES : EXAMPLES.slice(0, 1);

  return (
    <div className="space-y-5 stagger">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="card p-6 animate-fade-up" style={{
        background: "linear-gradient(135deg, rgba(0,229,195,0.08) 0%, rgba(200,255,0,0.04) 60%, var(--bg-card) 100%)",
        border: "1px solid rgba(0,229,195,0.15)"
      }}>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "rgba(0,229,195,0.12)", border: "1px solid rgba(0,229,195,0.2)" }}>
            📱
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-teal">Beta</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--teal)" }}>
                SMS Auto-Tracking
              </span>
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Paste. Parse. Save.
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Paste any bank SMS and our AI extracts the amount, merchant, and category automatically.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main test bench ───────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] animate-fade-up" style={{ animationDelay: "60ms" }}>

        {/* Input side */}
        <div className="card p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Paste Bank SMS
              </label>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {smsText.length} chars
              </span>
            </div>
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
              Paste one full transaction SMS. We will extract amount, merchant, date, and category.
            </p>
            <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder={"e.g. Rs. 250 debited from a/c XX1234 on 05-02-2026 to Zomato..."}
              className="w-full"
              style={{ minHeight: 170, resize: "vertical", lineHeight: 1.7 }}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--rose)" }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={handleParse}
              disabled={!smsText.trim() || loading}
              className="btn-primary"
              style={{ minHeight: 44 }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".3"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Parsing...
                </>
              ) : "🔍 Parse SMS"}
            </button>
            <button
              onClick={handleIngest}
              disabled={!smsText.trim() || ingesting}
              className="btn-ghost"
              style={{ minHeight: 44 }}
            >
              {ingesting ? "Ingesting..." : "⚡ Auto Ingest"}
            </button>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text)" }}>Parse</strong> — preview only.{" "}
            <strong style={{ color: "var(--text)" }}>Auto Ingest</strong> — saves automatically + detects ATM withdrawals.
          </p>

          {/* Example SMSes */}
          <div>
            <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Try an example
            </p>
            <div className="space-y-1.5">
              {visibleExamples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setSmsText(ex)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "var(--text-muted)", lineHeight: 1.5 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  {ex.length > 80 ? ex.slice(0, 80) + "…" : ex}
                </button>
              ))}
            </div>
            {EXAMPLES.length > 1 && (
              <button
                type="button"
                onClick={() => setShowAllExamples((v) => !v)}
                className="btn-ghost mt-2 w-full text-xs"
                style={{ minHeight: 40 }}
              >
                {showAllExamples ? "Show fewer examples" : "Show more examples"}
              </button>
            )}
          </div>
        </div>

        {/* Result side */}
        <div className="card p-5">
          <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Parsed Result
          </h3>

          {!result ? (
            <div className="min-h-[260px] flex flex-col items-center justify-center py-16 rounded-2xl text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Paste an SMS and hit Parse</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Results appear here</p>
            </div>
          ) : result.type === "cash_withdrawal" ? (
            /* ATM withdrawal result */
            <div className="space-y-4">
              <div className="p-5 rounded-2xl text-center" style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.15)" }}>
                <p className="text-3xl mb-2">💵</p>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--lime)" }}>ATM Withdrawal Detected</p>
                <p className="text-3xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--lime)" }}>
                  ₹{result.amount}
                </p>
              </div>
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.12)", color: "var(--lime)" }}>
                ✅ Automatically posted to your cash wallet
              </div>
            </div>
          ) : (
            /* Expense result */
            <div className="space-y-4">
              {/* Amount hero */}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Amount Detected</p>
                <p className="text-4xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--lime)" }}>
                  ₹{result.amount || "N/A"}
                </p>
              </div>

              {/* Fields grid */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { label: "Merchant", value: result.merchant || "Unknown" },
                  { label: "Date", value: result.date || "N/A" },
                  { label: "Category", value: result.category || "N/A" },
                  { label: "Type", value: result.type || "expense" },
                ].map((f) => (
                  <div key={f.label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{f.label}</p>
                    <p className="text-sm font-semibold break-words">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Category override if unknown merchant */}
              {needsCategorySelect && (
                <div className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: "var(--amber)" }}>
                    ⚠️ Merchant not recognized — choose a category:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const color = catColors[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className="cat-chip text-xs"
                          style={selectedCategory === cat
                            ? { background: `${color}18`, borderColor: color, color }
                            : {}
                          }
                        >
                          {catEmoji[cat]} {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={handleSaveExpense} disabled={saving} className="btn-primary w-full">
                {saving ? "Saving..." : "💾 Save as Expense"}
              </button>
              <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
                Saved expenses appear in Dashboard, Analytics & Budget
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Security & features ───────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 animate-fade-up" style={{ animationDelay: "120ms" }}>

        {/* Privacy */}
        <div className="card p-5">
          <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-display)" }}>
            🔒 Privacy First
          </h3>
          <div className="space-y-2">
            {[
              { icon: "✅", text: "SMS access requires explicit opt-in" },
              { icon: "✅", text: "Only transactional keywords are parsed" },
              { icon: "✅", text: "Revoke permission anytime in Settings" },
              { icon: "✅", text: "Data stays in your account, never shared" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(200,255,0,0.04)", border: "1px solid rgba(200,255,0,0.08)" }}>
                <span>{item.icon}</span>
                <span style={{ color: "var(--text-muted)" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>
              🚀 Coming Soon
            </h3>
            <span className="badge badge-amber">Q2 2026</span>
          </div>
          <div className="space-y-3">
            {[
              { icon: "🤖", title: "Auto SMS detection", desc: "Read bank SMS in background with your permission" },
              { icon: "📊", title: "Confidence scoring", desc: "ML score before auto-adding any expense" },
              { icon: "✋", title: "Review queue", desc: "One-tap approve or reject parsed expenses" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <span className="text-xl flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-ghost w-full mt-4 text-sm">
            Request Early Access →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmsParser;
