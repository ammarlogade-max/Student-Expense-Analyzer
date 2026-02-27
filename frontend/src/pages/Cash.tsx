import { useEffect, useMemo, useState } from "react";
import {
  addCashExpense,
  addCashWithdrawal,
  addCashAdjustment,
  getCashWallet,
  getWeeklyCashReconciliation,
  runCashReconciliationNow
} from "../lib/api";
import type { CashAlert, CashTransaction, CashWallet } from "../lib/types";
import { useToast } from "../context/ToastContext";
import VoiceEntry from "../components/VoiceEntry";

const categories = [
  "Food", "Shopping", "Transport", "Housing",
  "Education", "Entertainment", "Health", "Other"
];

const catEmoji: Record<string, string> = {
  Food: "\u{1F354}", Shopping: "\u{1F6CD}\uFE0F", Travel: "\u{1F697}", Transport: "\u{1F687}",
  Health: "\u{1F48A}", Entertainment: "\u{1F3AC}", Groceries: "\u{1F6D2}", Education: "\u{1F4DA}",
  Housing: "\u{1F3E0}", Other: "\u{1F4E6}", "Cash Withdrawal": "\u{1F4B5}", Adjustment: "\u2696\uFE0F"
};

function suggestCategory(text: string) {
  const v = text.toLowerCase();
  if (/(food|snack|meal|tea|coffee|restaurant|biryani|lunch|dinner)/.test(v)) return "Food";
  if (/(shopping|flipkart|amazon|myntra|store|clothes)/.test(v)) return "Shopping";
  if (/(bus|metro|auto|cab|taxi|fuel|petrol|uber|ola|rapido)/.test(v)) return "Transport";
  if (/(doctor|medicine|pharmacy|clinic|hospital)/.test(v)) return "Health";
  if (/(movie|cinema|game|party|netflix|spotify)/.test(v)) return "Entertainment";
  if (/(book|course|tuition|college|school|fees)/.test(v)) return "Education";
  return "Other";
}

const Skeleton = () => (
  <div className="skeleton h-14 rounded-xl" />
);

const formatINR = (value: number) => `\u20B9 ${value.toLocaleString("en-IN")}`;

const TxRow = ({ item }: { item: CashTransaction }) => {
  const isWithdrawal = item.type === "withdrawal";
  const isExpense = item.type === "expense";
  const dateText = new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: isWithdrawal ? "rgba(255,185,48,0.12)"
                : isExpense ? "rgba(255,77,109,0.08)"
                : "rgba(255,255,255,0.05)"
            }}
          >
            {catEmoji[item.category || "Other"] || "\u{1F4E6}"}
          </div>
          <p className="text-sm font-semibold capitalize truncate">
            {item.type === "withdrawal" ? "ATM Withdrawal" : item.category || "Cash"}
          </p>
        </div>
        <p
          className="text-sm font-bold text-right flex-shrink-0 whitespace-nowrap"
          style={{ color: isWithdrawal ? "var(--lime)" : isExpense ? "var(--rose)" : "var(--text-muted)" }}
        >
          {isWithdrawal ? "+" : isExpense ? "-" : "~"}{formatINR(Math.round(item.amount))}
        </p>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
        <span className="capitalize">{item.source}</span>
        <span>-</span>
        <span>{dateText}</span>
        <span className="ml-auto uppercase font-semibold">{item.type}</span>
      </div>

      {item.note && (
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {item.note}
        </p>
      )}
    </div>
  );
};

const Cash = () => {
  const { push } = useToast();
  const [wallet, setWallet] = useState<CashWallet | null>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [alerts, setAlerts] = useState<CashAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "withdraw" | "adjust">("expense");

  const [cashForm, setCashForm] = useState({ amount: "", category: "Food", description: "" });
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const [recon, setRecon] = useState({ withdrawals: 0, expenses: 0, gap: 0 });

  const lowCash = (wallet?.balance || 0) < 200;

  const load = async () => {
    setLoading(true);
    try {
      const [walletResult, reconResult] = await Promise.allSettled([
        getCashWallet(),
        getWeeklyCashReconciliation()
      ]);
      if (walletResult.status === "fulfilled") {
        setWallet(walletResult.value.wallet);
        setTransactions(walletResult.value.transactions);
        setAlerts(walletResult.value.alerts);
      }
      if (reconResult.status === "fulfilled") {
        setRecon({
          withdrawals: reconResult.value.summary.withdrawals,
          expenses: reconResult.value.summary.expenses,
          gap: reconResult.value.summary.gap
        });
      }
    } catch {
      push("Failed to load cash data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const topCashCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      const key = t.category || "Other";
      totals[key] = (totals[key] || 0) + t.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
  }, [transactions]);

  const saveCashExpense = async () => {
    if (!cashForm.amount) { push("Amount required", "error"); return; }
    setSaving(true);
    try {
      await addCashExpense({ amount: Number(cashForm.amount), category: cashForm.category, description: cashForm.description || undefined, source: "manual" });
      setCashForm({ amount: "", category: "Food", description: "" });
      setSheetOpen(false);
      push("Cash expense saved", "success");
      await load();
    } catch (err: any) {
      push(err.message || "Failed", "error");
    } finally { setSaving(false); }
  };

  const saveWithdrawal = async () => {
    if (!withdrawAmount) { push("Amount required", "error"); return; }
    setSaving(true);
    try {
      await addCashWithdrawal({ amount: Number(withdrawAmount), source: "manual", note: "Manual ATM top-up" });
      setWithdrawAmount("");
      setSheetOpen(false);
      push("Withdrawal recorded - wallet topped up", "success");
      await load();
    } catch (err: any) {
      push(err.message || "Failed", "error");
    } finally { setSaving(false); }
  };

  const saveAdjustment = async () => {
    if (!adjustmentAmount) { push("Amount required", "error"); return; }
    setSaving(true);
    try {
      await addCashAdjustment({ amount: Number(adjustmentAmount), note: "Manual adjustment" });
      setAdjustmentAmount("");
      setSheetOpen(false);
      push("Wallet adjusted", "success");
      await load();
    } catch (err: any) {
      push(err.message || "Failed", "error");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div
        className="relative overflow-hidden rounded-3xl p-6 animate-fade-up"
        style={{
          background: "linear-gradient(135deg, rgba(200,255,0,0.1) 0%, rgba(0,229,195,0.06) 60%, rgba(14,20,32,0) 100%)",
          border: "1px solid rgba(200,255,0,0.12)"
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--text-muted)" }}>
              Cash Wallet
            </p>
            <p
              className="font-black leading-none whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)", color: lowCash ? "var(--amber)" : "var(--lime)", fontSize: "clamp(2rem, 9vw, 3rem)" }}
            >
              {loading ? "-" : formatINR(Math.round(wallet?.balance || 0))}
            </p>
            {lowCash && !loading && (
              <div
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(255,185,48,0.12)", border: "1px solid rgba(255,185,48,0.3)", color: "var(--amber)" }}
              >
                Low - top up your wallet
              </div>
            )}
          </div>
          <div className="rounded-xl px-4 py-3 text-center sm:text-right text-sm" style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-2xl">Cash</p>
            <p className="mt-1 text-xs">This week</p>
            <p className="font-semibold whitespace-nowrap" style={{ color: "var(--text)" }}>
              -{formatINR(Math.round(recon.expenses))}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Withdrawals", value: formatINR(Math.round(recon.withdrawals)), icon: "W", color: "var(--lime)" },
          { label: "Cash Spent", value: formatINR(Math.round(recon.expenses)), icon: "S", color: "var(--rose)" },
          { label: "Untracked", value: formatINR(Math.round(recon.gap)), icon: "U", color: recon.gap > 200 ? "var(--amber)" : "var(--text-muted)" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className="text-lg font-bold whitespace-nowrap" style={{ fontFamily: "var(--font-display)", color: s.color }}>
              {loading ? "-" : s.value}
            </p>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="card p-5">
          <VoiceEntry onSaved={load} />
        </div>

        <div className="card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>
              Weekly Reconciliation
            </h3>
            <button
              onClick={async () => {
                await runCashReconciliationNow();
                await load();
                push("Reconciliation done", "success");
              }}
              className="btn-ghost w-full sm:w-auto px-3 py-2 text-xs"
              style={{ minHeight: 44 }}
            >
              Run now
            </button>
          </div>

          <div
            className="p-4 rounded-xl mb-4"
            style={{
              background: recon.gap > 200 ? "rgba(255,185,48,0.08)" : "rgba(255,255,255,0.03)",
              border: recon.gap > 200 ? "1px solid rgba(255,185,48,0.2)" : "1px solid rgba(255,255,255,0.06)"
            }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Untracked gap</p>
            <p
              className="text-3xl font-black whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)", color: recon.gap > 200 ? "var(--amber)" : "var(--lime)" }}
            >
              {loading ? "-" : formatINR(Math.round(recon.gap))}
            </p>
          </div>

          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Gap = money withdrawn but not logged as cash expense.
          </p>

          {alerts.length === 0 ? (
            <div
              className="text-center py-6 rounded-xl"
              style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
            >
              <p className="text-xl mb-1">OK</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No active alerts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: "rgba(255,185,48,0.08)", border: "1px solid rgba(255,185,48,0.2)", color: "var(--amber)" }}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 animate-fade-up" style={{ animationDelay: "180ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>
            Cash Transactions
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Top: {topCashCategory}
          </p>
        </div>
        <div className="space-y-3">
          {loading
            ? [1, 2, 3].map((i) => <Skeleton key={i} />)
            : transactions.length === 0
            ? (
              <div
                className="text-center py-10 rounded-xl"
                style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
              >
                <p className="text-3xl mb-2">Tx</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No cash transactions yet
                </p>
              </div>
            )
            : transactions.map((item) => <TxRow key={item.id} item={item} />)
          }
        </div>
      </div>

      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-24 right-5 lg:bottom-8 h-14 w-14 rounded-full text-2xl font-bold shadow-2xl flex items-center justify-center z-40 transition-transform hover:scale-110 active:scale-95"
        style={{ background: "var(--lime)", color: "#080c12", boxShadow: "0 8px 30px rgba(200,255,0,0.35)" }}
        aria-label="Add cash expense"
      >
        +
      </button>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSheetOpen(false); }}
        >
          <div
            className="w-full rounded-t-3xl p-6 animate-scale-in"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                {(["expense", "withdraw", "adjust"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={activeTab === tab
                      ? { background: "var(--lime)", color: "#080c12" }
                      : { color: "var(--text-muted)" }
                    }
                  >
                    {tab === "expense" ? "Cash Expense" : tab === "withdraw" ? "ATM Top-up" : "Adjust"}
                  </button>
                ))}
              </div>
              <button onClick={() => setSheetOpen(false)} className="btn-ghost px-3 py-1.5 text-xs">X</button>
            </div>

            {activeTab === "expense" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Amount (Rs.)</label>
                  <input type="number" value={cashForm.amount} onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })} placeholder="0" autoFocus style={{ fontSize: 24, fontWeight: 700 }} />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCashForm({ ...cashForm, category: cat })}
                        className="cat-chip"
                        style={cashForm.category === cat ? { background: "rgba(200,255,0,0.12)", borderColor: "var(--lime)", color: "var(--lime)" } : {}}
                      >
                        {catEmoji[cat]} {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Note (optional)</label>
                  <input
                    value={cashForm.description}
                    onChange={(e) => setCashForm({ ...cashForm, description: e.target.value, category: suggestCategory(e.target.value) || cashForm.category })}
                    placeholder="e.g. chai and samosa"
                  />
                </div>
                <button onClick={saveCashExpense} disabled={saving} className="btn-primary w-full" style={{ minHeight: 44 }}>
                  {saving ? "Saving..." : "Save Cash Expense"}
                </button>
              </div>
            )}

            {activeTab === "withdraw" && (
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl text-sm"
                  style={{ background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.12)" }}
                >
                  <p className="font-semibold mb-1">ATM withdrawal - adds to wallet</p>
                  <p style={{ color: "var(--text-muted)" }}>
                    Enter the amount you took out from ATM. This increases your cash wallet balance.
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>ATM Amount (Rs.)</label>
                  <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="e.g. 2000" style={{ fontSize: 24, fontWeight: 700 }} />
                </div>
                <button onClick={saveWithdrawal} disabled={saving} className="btn-primary w-full" style={{ minHeight: 44 }}>
                  {saving ? "Recording..." : "Record Withdrawal"}
                </button>
              </div>
            )}

            {activeTab === "adjust" && (
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl text-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p className="font-semibold mb-1">Manual adjustment</p>
                  <p style={{ color: "var(--text-muted)" }}>
                    Correct your wallet balance. Use positive (+200) to add or negative (-50) to deduct.
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Amount (+/-)</label>
                  <input type="number" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} placeholder="+200 or -50" style={{ fontSize: 24, fontWeight: 700 }} />
                </div>
                <button onClick={saveAdjustment} disabled={saving} className="btn-ghost w-full" style={{ minHeight: 44 }}>
                  {saving ? "Adjusting..." : "Apply Adjustment"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cash;
