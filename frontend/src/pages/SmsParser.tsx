import { useState } from "react";
import { addExpense, ingestSms, parseSms } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const categories = ["Food","Shopping","Transport","Housing","Education","Entertainment","Health","Other"];
const catColors: Record<string,string> = { Food:"#f59e0b",Shopping:"#ec4899",Transport:"#14b8a6",Housing:"#f97316",Education:"#6366f1",Entertainment:"#a78bfa",Health:"#10b981",Other:"#94a3b8" };

const EXAMPLES = [
  { bank:"Swiggy / HDFC", sms:"Dear Customer, INR 450.00 debited from A/c XX1234 on 28-Feb at Swiggy. Avl Bal: INR 8,220.00" },
  { bank:"Ola / HDFC", sms:"₹280 spent on Ola using HDFC Debit Card XX9876. Available balance: ₹12,450" },
  { bank:"ATM / ICICI", sms:"Rs.1200.00 withdrawn from ATM on 27-Feb-26. Avl Bal Rs.7350.00 ICICI Bank" },
];

const steps = [
  { icon:<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>, title:"Paste SMS", desc:"Copy a transaction message from your banking app" },
  { icon:<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>, title:"AI Parses", desc:"ML model extracts amount, merchant and category" },
  { icon:<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>, title:"Auto-Add", desc:"Record the expense instantly with one tap" },
];

const SmsParser = () => {
  useFeatureTracking("sms-parser", "Viewed SMS parser");
  const { push } = useToast();
  const [smsText, setSmsText] = useState("");
  const [result, setResult] = useState<{ amount:string|null; date:string|null; merchant:string; category:string; type?:string }|null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Other");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleParse = async () => {
    if (!smsText.trim()) { push("Paste an SMS first","error"); return; }
    setLoading(true); setResult(null);
    try { const res = await parseSms(smsText); setResult(res.result); setSelectedCategory(res.result.category||"Other"); }
    catch (err:any) { push(err.message||"Parse failed","error"); }
    finally { setLoading(false); }
  };

  const handleIngest = async () => {
    if (!smsText.trim()) { push("Paste an SMS first","error"); return; }
    setLoading(true); setResult(null);
    try {
      const res = await ingestSms(smsText); setResult(res.result); setSelectedCategory(res.result.category||"Other");
      push(res.result.type==="cash_withdrawal" ? "Cash withdrawal recorded" : "Expense added automatically","success");
    } catch (err:any) { push(err.message||"Ingest failed","error"); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!result?.amount) { push("No amount parsed","error"); return; }
    setSaving(true);
    try { await addExpense({ amount:parseFloat(result.amount), category:selectedCategory, description:`SMS: ${result.merchant}` }); push("Expense saved!","success"); setResult(null); setSmsText(""); }
    catch (err:any) { push(err.message||"Save failed","error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 stagger">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>SMS Parser</h1>
        <p className="text-sm" style={{ color:"var(--text-secondary)" }}>Auto-extract expense data from your bank SMS messages</p>
      </div>

      {/* How it works — horizontal on desktop */}
      <div className="grid grid-cols-3 gap-3">
        {steps.map((s, i) => (
          <div key={i} className="card !p-4 flex flex-col items-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3 text-white" style={{ background:"var(--gradient-primary)" }}>
              {s.icon}
            </div>
            <p className="text-sm font-semibold mb-0.5" style={{ color:"var(--text-primary)" }}>{s.title}</p>
            <p className="text-xs leading-relaxed" style={{ color:"var(--text-tertiary)" }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* SMS Input card */}
      <div className="card space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:"var(--text-secondary)" }}>Bank Transaction SMS</label>
          <textarea value={smsText} onChange={e => setSmsText(e.target.value)} rows={4}
            placeholder="Paste your bank SMS here — e.g. 'INR 450.00 debited from A/c XX1234 at Swiggy…'"
            style={{ resize:"none" }}/>
        </div>

        {/* Example buttons */}
        <div>
          <p className="text-xs mb-2" style={{ color:"var(--text-muted)" }}>Try an example:</p>
          <div className="space-y-1.5">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setSmsText(ex.sms)} className="w-full text-left rounded-xl px-3 py-2.5 text-sm transition"
                style={{ background:"var(--bg-tertiary)", border:"1px solid var(--border-light)", color:"var(--text-secondary)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="var(--border-medium)"; e.currentTarget.style.color="var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border-light)"; e.currentTarget.style.color="var(--text-secondary)"; }}>
                <span className="font-medium" style={{ color:"var(--primary)" }}>{ex.bank}</span>
                <span className="ml-2 text-xs" style={{ color:"var(--text-tertiary)" }}>{ex.sms.slice(0,60)}…</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleParse} disabled={loading} className="btn-secondary flex-1">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/></svg>
            {loading ? "Parsing…" : "Parse Only"}
          </button>
          <button onClick={handleIngest} disabled={loading} className="btn-primary flex-1">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            {loading ? "Processing…" : "Auto-Add"}
          </button>
        </div>
      </div>

      {/* Parse result */}
      {result && (
        <div className="card" style={{ borderColor:"rgba(99,102,241,0.3)", background:"linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(20,184,166,0.04) 100%)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.3)" }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#10b981" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <p className="font-semibold text-sm" style={{ color:"var(--text-primary)" }}>Parsed successfully</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
            {[
              { label:"Amount", value:result.amount ? `₹${parseFloat(result.amount).toLocaleString("en-IN")}` : "—", color:"var(--primary)" },
              { label:"Merchant", value:result.merchant||"Unknown", color:"var(--accent)" },
              { label:"Date", value:result.date||"Today", color:"var(--warning)" },
              { label:"Type", value:result.type==="cash_withdrawal"?"ATM Withdrawal":"Expense", color:result.type==="cash_withdrawal"?"var(--warning)":"var(--info)" },
            ].map(f => (
              <div key={f.label} className="rounded-xl px-3 py-2.5" style={{ background:"var(--bg-tertiary)", border:"1px solid var(--border-light)" }}>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color:"var(--text-muted)" }}>{f.label}</p>
                <p className="text-sm font-bold truncate" style={{ color:f.color }}>{f.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:"var(--text-secondary)" }}>Category</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => {
                const color = catColors[cat]; const active = selectedCategory===cat;
                return (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className="cat-chip"
                    style={active ? { background:`${color}18`, borderColor:color, color } : {}}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            {saving ? "Saving…" : "Save as Expense →"}
          </button>
        </div>
      )}
    </div>
  );
};
export default SmsParser;
