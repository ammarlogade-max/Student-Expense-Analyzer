
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(formData.name, formData.email, formData.password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: "📲", title: "SMS Auto-track", desc: "Bank SMS parsed automatically" },
    { icon: "🤖", title: "AI Categories", desc: "ML classifies every expense" },
    { icon: "💸", title: "Cash Wallet", desc: "Track ATM withdrawals too" },
    { icon: "📊", title: "Live Analytics", desc: "Real-time spending insights" },
  ];

  return (
    <div
      className="min-h-screen mesh-bg grain flex items-center justify-center px-4 py-12"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Orbs */}
      <div
        className="pointer-events-none fixed"
        style={{
          top: "20%", left: "-8%",
          width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,195,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-5xl grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">

        {/* ── Left: feature grid (desktop) ──────────────────────────── */}
        <div className="hidden lg:block animate-fade-up">
          <div className="flex items-center gap-3 mb-10">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: "var(--lime)", color: "#080c12" }}
            >
              ₹IQ
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>
              ExpenseIQ
            </span>
          </div>

          <h1
            className="text-4xl leading-[1.15] mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
          >
            Your student finances.<br />
            <span style={{ color: "var(--teal)" }}>Finally intelligent.</span>
          </h1>
          <p className="mb-10" style={{ color: "var(--text-muted)", fontSize: 15 }}>
            Join thousands of students who stopped leaking money and started building wealth — one expense at a time.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="mt-2 text-sm font-semibold">{f.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Free badge */}
          <div
            className="mt-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", color: "var(--lime)" }}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            100% Free for Students
          </div>
        </div>

        {/* ── Right: signup form ─────────────────────────────────────── */}
        <div
          className="animate-scale-in card-glass p-8 rounded-3xl"
          style={{ border: "1px solid rgba(255,255,255,0.09)" }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-[11px]"
              style={{ background: "var(--lime)", color: "#080c12" }}
            >
              ₹IQ
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
              ExpenseIQ
            </span>
          </div>

          <h2
            className="text-2xl mb-1"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Create account
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Start tracking in under 60 seconds.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Aryan Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@college.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.25)", color: "var(--rose)" }}
              >
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".3"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Creating...
                </>
              ) : (
                <>Create free account →</>
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-center" style={{ color: "var(--text-muted)" }}>
            By signing up you agree to our{" "}
            <span style={{ color: "var(--lime)" }}>Terms of Service</span> and{" "}
            <span style={{ color: "var(--lime)" }}>Privacy Policy</span>.
          </p>

          <div
            className="mt-6 pt-6 text-center text-sm"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
          >
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--lime)", fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;