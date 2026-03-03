import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeOnboarding } from "../lib/api";
import { useToast } from "../context/ToastContext";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OnboardingData {
  college: string;
  yearOfStudy: number;
  city: string;
  monthlyAllowance: string;
  budgetSplit: Record<string, number>;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "Food",      emoji: "🍔", color: "#f97316" },
  { key: "Travel",    emoji: "🚌", color: "#3b82f6" },
  { key: "Study",     emoji: "📚", color: "#8b5cf6" },
  { key: "Shopping",  emoji: "🛒", color: "#ec4899" },
  { key: "Health",    emoji: "💊", color: "#10b981" },
  { key: "Fun",       emoji: "🎮", color: "#f59e0b" },
  { key: "Utilities", emoji: "💡", color: "#06b6d4" },
  { key: "Other",     emoji: "📦", color: "#6b7280" },
];

const YEAR_OPTIONS = [
  "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "PG / Masters",
];

const DEFAULT_SPLIT: Record<string, number> = {
  Food: 30, Travel: 20, Study: 15, Shopping: 15,
  Health: 8, Fun: 7, Utilities: 3, Other: 2,
};

// ── Step progress pill ─────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < current
              ? "w-6 bg-[#c8ff00]"
              : i === current
              ? "w-8 bg-[#c8ff00]"
              : "w-2 bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

// ── Step 0: Welcome ──────────────────────────────────────────────────────────
function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 text-7xl animate-bounce">👋</div>
      <h1 className="text-3xl font-bold text-white mb-2">
        Hey {name?.split(" ")[0]}!
      </h1>
      <p className="text-white/60 text-sm mb-2">Welcome to</p>
      <div className="text-4xl font-black mb-1">
        <span className="text-[#c8ff00]">Expense</span>
        <span className="text-white">IQ</span>
      </div>
      <p className="text-white/50 text-xs mb-8">
        AI-powered finance for Indian students
      </p>

      <div className="w-full space-y-3 mb-8">
        {[
          ["🎙", "Voice log expenses in 3 seconds"],
          ["📱", "Auto-parse your bank SMS"],
          ["🏆", "Earn your Finance Score daily"],
          ["📊", "Budget alerts before you overspend"],
        ].map(([icon, text]) => (
          <div
            key={text}
            className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/70"
          >
            <span className="text-lg">{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full rounded-2xl bg-[#c8ff00] py-4 text-base font-bold text-black transition hover:bg-[#b8ef00] active:scale-95"
      >
        Let's set up your profile →
      </button>
    </div>
  );
}

// ── Step 1: College Info ─────────────────────────────────────────────────────
function StepCollege({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onChange: (k: keyof OnboardingData, v: any) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid = data.college.trim().length >= 3;

  return (
    <div>
      <div className="mb-6 text-5xl text-center">🎓</div>
      <h2 className="text-2xl font-bold text-white text-center mb-1">
        Your college
      </h2>
      <p className="text-white/50 text-sm text-center mb-8">
        Helps us personalise insights for your academic year
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">
            College / University *
          </label>
          <input
            value={data.college}
            onChange={(e) => onChange("college", e.target.value)}
            placeholder="e.g. VJTI Mumbai"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-[#c8ff00]/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">
            Year of Study
          </label>
          <div className="grid grid-cols-3 gap-2">
            {YEAR_OPTIONS.map((yr, i) => (
              <button
                key={yr}
                onClick={() => onChange("yearOfStudy", i + 1)}
                className={`rounded-xl py-2.5 text-xs font-medium transition ${
                  data.yearOfStudy === i + 1
                    ? "bg-[#c8ff00] text-black"
                    : "bg-white/5 border border-white/10 text-white/60 hover:border-[#c8ff00]/40"
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">
            City
          </label>
          <input
            value={data.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="e.g. Mumbai"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-[#c8ff00]/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 rounded-2xl border border-white/10 py-3.5 text-sm text-white/60 hover:bg-white/5"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-[2] rounded-2xl bg-[#c8ff00] py-3.5 text-sm font-bold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b8ef00] transition"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Monthly Allowance ─────────────────────────────────────────────────
function StepAllowance({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onChange: (k: keyof OnboardingData, v: any) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const val = parseFloat(data.monthlyAllowance) || 0;
  const valid = val >= 500;

  const presets = [3000, 5000, 8000, 12000, 15000];

  return (
    <div>
      <div className="mb-6 text-5xl text-center">💰</div>
      <h2 className="text-2xl font-bold text-white text-center mb-1">
        Monthly allowance
      </h2>
      <p className="text-white/50 text-sm text-center mb-8">
        How much do you receive each month from parents or stipend?
      </p>

      {/* Big rupee input */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[#c8ff00] font-bold">
          ₹
        </span>
        <input
          type="number"
          value={data.monthlyAllowance}
          onChange={(e) => onChange("monthlyAllowance", e.target.value)}
          placeholder="0"
          min={500}
          className="w-full rounded-2xl bg-white/5 border border-white/10 pl-10 pr-4 py-5 text-2xl font-bold text-white placeholder-white/20 focus:border-[#c8ff00]/60 focus:outline-none text-center"
        />
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onChange("monthlyAllowance", String(p))}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              parseFloat(data.monthlyAllowance) === p
                ? "bg-[#c8ff00] text-black"
                : "bg-white/5 border border-white/10 text-white/60 hover:border-[#c8ff00]/40"
            }`}
          >
            ₹{p.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      {val >= 500 && (
        <div className="rounded-2xl bg-[#c8ff00]/10 border border-[#c8ff00]/20 px-4 py-3 text-sm text-[#c8ff00] text-center mb-4">
          ₹{(val / 30).toFixed(0)} per day · ₹{(val / 4).toFixed(0)} per week
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-2xl border border-white/10 py-3.5 text-sm text-white/60 hover:bg-white/5"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-[2] rounded-2xl bg-[#c8ff00] py-3.5 text-sm font-bold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b8ef00] transition"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Budget Split ──────────────────────────────────────────────────────
function StepBudget({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onChange: (k: keyof OnboardingData, v: any) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const total = Object.values(data.budgetSplit).reduce((s, v) => s + v, 0);
  const remaining = 100 - total;
  const valid = Math.abs(remaining) <= 1;
  const monthly = parseFloat(data.monthlyAllowance) || 0;

  const updateSplit = (cat: string, val: number) => {
    onChange("budgetSplit", { ...data.budgetSplit, [cat]: val });
  };

  return (
    <div>
      <div className="mb-4 text-5xl text-center">📊</div>
      <h2 className="text-2xl font-bold text-white text-center mb-1">
        Budget split
      </h2>
      <p className="text-white/50 text-sm text-center mb-2">
        How do you want to split your ₹{parseInt(data.monthlyAllowance || "0").toLocaleString("en-IN")}?
      </p>

      {/* Total indicator */}
      <div
        className={`text-center text-xs font-bold mb-4 py-2 rounded-xl ${
          valid
            ? "text-[#c8ff00] bg-[#c8ff00]/10"
            : remaining > 0
            ? "text-amber-400 bg-amber-400/10"
            : "text-rose-400 bg-rose-400/10"
        }`}
      >
        {valid
          ? "✅ Budget perfectly balanced!"
          : remaining > 0
          ? `${remaining}% remaining to allocate`
          : `${Math.abs(remaining)}% over — reduce some categories`}
      </div>

      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
        {CATEGORIES.map(({ key, emoji, color }) => {
          const pct = data.budgetSplit[key] ?? 0;
          const amt = ((pct / 100) * monthly).toFixed(0);
          return (
            <div key={key} className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  {emoji} {key}
                </span>
                <div className="flex items-center gap-2">
                  {monthly > 0 && (
                    <span className="text-xs text-white/40">₹{parseInt(amt).toLocaleString("en-IN")}</span>
                  )}
                  <span className="text-sm font-bold" style={{ color }}>
                    {pct}%
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                value={pct}
                onChange={(e) => updateSplit(key, Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${color} ${pct * 1.25}%, rgba(255,255,255,0.1) ${pct * 1.25}%)`,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-2xl border border-white/10 py-3.5 text-sm text-white/60 hover:bg-white/5"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-[2] rounded-2xl bg-[#c8ff00] py-3.5 text-sm font-bold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b8ef00] transition"
        >
          Looks good →
        </button>
      </div>
    </div>
  );
}

// ── Step 4: All Done ──────────────────────────────────────────────────────────
function StepDone({
  data,
  name,
  loading,
  onFinish,
}: {
  data: OnboardingData;
  name: string;
  loading: boolean;
  onFinish: () => void;
}) {
  const monthly = parseFloat(data.monthlyAllowance) || 0;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 relative">
        <div className="w-24 h-24 rounded-full bg-[#c8ff00]/10 border-2 border-[#c8ff00] flex items-center justify-center text-5xl">
          🏆
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#c8ff00] flex items-center justify-center text-black font-bold text-sm">
          ✓
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-1">
        You're all set, {name.split(" ")[0]}!
      </h2>
      <p className="text-white/50 text-sm mb-6">
        Your profile is ready. Here's your setup summary:
      </p>

      {/* Summary card */}
      <div className="w-full rounded-2xl bg-white/5 border border-white/10 divide-y divide-white/10 mb-6 text-left">
        {[
          ["🎓", "College", data.college],
          ["📍", "City", data.city || "—"],
          ["💰", "Monthly Budget", `₹${monthly.toLocaleString("en-IN")}`],
          ["📊", "Top Category", `${Object.entries(data.budgetSplit).sort((a, b) => b[1] - a[1])[0]?.[0]} (${Object.entries(data.budgetSplit).sort((a, b) => b[1] - a[1])[0]?.[1]}%)`],
        ].map(([icon, label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-white/50 text-sm">{icon} {label}</span>
            <span className="text-white text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Finance score new student */}
      <div className="w-full rounded-2xl bg-gradient-to-br from-[#c8ff00]/10 to-transparent border border-[#c8ff00]/20 px-4 py-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-[#c8ff00]/40 flex items-center justify-center text-2xl">
            😬
          </div>
          <div className="text-left">
            <p className="text-xs text-white/50 uppercase tracking-wider">Finance Score</p>
            <p className="text-white font-bold">New Student — Score: 0</p>
            <p className="text-xs text-white/40">Log your first expense to start earning points!</p>
          </div>
          <div className="ml-auto text-2xl font-black text-[#c8ff00]">0</div>
        </div>
      </div>

      <button
        onClick={onFinish}
        disabled={loading}
        className="w-full rounded-2xl bg-[#c8ff00] py-4 text-base font-bold text-black transition hover:bg-[#b8ef00] active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          "Go to Dashboard 🚀"
        )}
      </button>
    </div>
  );
}

// ── Main Onboarding Component ─────────────────────────────────────────────────
const TOTAL_STEPS = 5;

const Onboarding = () => {
  const navigate = useNavigate();
  const { push } = useToast();

  // Get user name from storage
  const storedUser = localStorage.getItem("expenseiq_user");
  const userName = storedUser ? JSON.parse(storedUser)?.name || "there" : "there";

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    college: "",
    yearOfStudy: 1,
    city: "",
    monthlyAllowance: "",
    budgetSplit: { ...DEFAULT_SPLIT },
  });

  const update = (k: keyof OnboardingData, v: any) =>
    setData((d) => ({ ...d, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        college: data.college,
        yearOfStudy: data.yearOfStudy,
        city: data.city,
        monthlyAllowance: parseFloat(data.monthlyAllowance),
        budgetSplit: data.budgetSplit,
      });
      push("Profile saved! Welcome to ExpenseIQ 🎉", "success");
      navigate("/dashboard");
    } catch (err: any) {
      push(err.message || "Failed to save profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4 py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#c8ff00]/5 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-500/5 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs text-white/30 uppercase tracking-widest">
            Setup
          </span>
          <span className="text-xs text-white/30">
            {step + 1} / {TOTAL_STEPS}
          </span>
        </div>

        <StepDots current={step} total={TOTAL_STEPS} />

        {/* Card */}
        <div className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
          {step === 0 && (
            <StepWelcome name={userName} onNext={next} />
          )}
          {step === 1 && (
            <StepCollege data={data} onChange={update} onNext={next} onBack={back} />
          )}
          {step === 2 && (
            <StepAllowance data={data} onChange={update} onNext={next} onBack={back} />
          )}
          {step === 3 && (
            <StepBudget data={data} onChange={update} onNext={next} onBack={back} />
          )}
          {step === 4 && (
            <StepDone data={data} name={userName} loading={loading} onFinish={finish} />
          )}
        </div>

        {/* Skip link (only show after welcome) */}
        {step > 0 && step < 4 && (
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full mt-4 text-xs text-white/25 hover:text-white/50 transition py-2"
          >
            Skip for now — I'll set this up later
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
