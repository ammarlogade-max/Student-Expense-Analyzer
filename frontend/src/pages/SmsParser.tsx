import { useState } from "react";
import { addExpense, parseSms } from "../lib/api";
import { useToast } from "../context/ToastContext";

const SmsParser = () => {
  const [smsText, setSmsText] = useState("");
  const categories = [
    "Food",
    "Transport",
    "Housing",
    "Education",
    "Entertainment",
    "Health",
    "Other"
  ];
  const [result, setResult] = useState<{
    amount: string | null;
    date: string | null;
    merchant: string;
    category: string;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Other");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useToast();

  const handleParse = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await parseSms(smsText);
      setResult(res.result);
      const parsedCategory = res.result?.category || "";
      const fallback =
        !parsedCategory || parsedCategory === "Uncategorized"
          ? "Other"
          : parsedCategory;
      setSelectedCategory(fallback);
    } catch (err: any) {
      setError(err.message || "Failed to parse SMS");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!result) return;
    if (!result.amount) {
      push("Parsed amount missing", "error");
      return;
    }
    setSaving(true);
    try {
      await addExpense({
        amount: Number(result.amount),
        category:
          !result.category ||
          result.category === "Uncategorized" ||
          !result.merchant
            ? selectedCategory
            : result.category,
        description: result.merchant || "SMS expense"
      });
      push("Saved to expenses", "success");
    } catch (err: any) {
      push(err.message || "Failed to save expense", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
          SMS Parser
        </p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold">
          Prepare for automated expense capture.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          We will soon read transactional SMS messages with your consent to
          auto-create expenses. Your data stays private and encrypted.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Security First</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {[
              "SMS access will always require explicit opt-in.",
              "We parse only transactional keywords, not personal messages.",
              "You can revoke permission anytime from Settings.",
              "Parsed data stays in your account and is never shared."
            ].map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Coming Soon</h3>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              Smart detection of merchant, amount, and category.
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              ML-driven confidence score before auto-adding.
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              Manual review queue with one-tap approvals.
            </div>
          </div>

          <button className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Request Early Access
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">SMS Test Bench</h3>
        <p className="text-sm text-slate-500">
          Paste a bank SMS to preview parsing and categorization.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="e.g. Rs. 250 debited from a/c ending XX1234 on 05-02-2026 to Zomato."
              className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
            />
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
            <button
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              onClick={handleParse}
              disabled={!smsText || loading}
            >
              {loading ? "Parsing..." : "Parse SMS"}
            </button>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            {!result ? (
              <p>Parsed results will appear here.</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <p>
                    <strong>Merchant:</strong> {result.merchant || "Unknown"}
                  </p>
                  <p>
                    <strong>Amount:</strong> {result.amount || "N/A"}
                  </p>
                  <p>
                    <strong>Date:</strong> {result.date || "N/A"}
                  </p>
                  <p>
                    <strong>Category:</strong> {result.category || "N/A"}
                  </p>
                </div>
                {(!result.category ||
                  result.category === "Uncategorized" ||
                  !result.merchant) && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">
                      Merchant not recognized. Please choose a category.
                    </p>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                  onClick={handleSaveExpense}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save as Expense"}
                </button>
                <p className="text-xs text-slate-500">
                  Saved expenses show up on Dashboard, Analytics, and Budget pages.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SmsParser;
