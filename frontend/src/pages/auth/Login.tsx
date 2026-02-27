
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen mesh-bg grain flex items-center justify-center px-4 py-12"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Background orbs */}
      <div
        className="pointer-events-none fixed"
        style={{
          top: "-10%", right: "-5%",
          width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,255,0,0.07) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none fixed"
        style={{
          bottom: "-10%", left: "-5%",
          width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,195,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">

        {/* ── Left: brand story ──────────────────────────────────────── */}
        <div className="animate-fade-up hidden lg:block">
          {/* Logo */}
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
            className="text-5xl leading-[1.12] mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
          >
            Every rupee.<br />
            <span style={{ color: "var(--lime)" }}>Tracked.</span><br />
            Every decision.<br />Smarter.
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 400 }}>
            The AI-powered financial brain for students who want to stop guessing and start growing.
          </p>

          {/* Social proof pills */}
          <div className="flex flex-wrap gap-3 mt-10">
            {["📊 SMS Auto-detect", "🤖 ML Categorization", "💰 Cash Wallet", "📈 Budget Alerts"].map((f) => (
              <span
                key={f}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-muted)"
                }}
              >
                {f}
              </span>
            ))}
          </div>

          {/* Testimonial */}
          <div
            className="mt-10 p-5 rounded-2xl"
            style={{ background: "rgba(200,255,0,0.05)", border: "1px solid rgba(200,255,0,0.15)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
              "Finally an app that actually understands how students spend money. The SMS tracking is insane."
            </p>
            <p className="mt-3 text-xs font-semibold" style={{ color: "var(--lime)" }}>
              — Finance Club, IIT Mumbai
            </p>
          </div>
        </div>

        {/* ── Right: login form ──────────────────────────────────────── */}
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
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Your financial dashboard is waiting.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
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
                  Signing in...
                </>
              ) : (
                <>Sign in →</>
              )}
            </button>
          </form>

          <div
            className="mt-6 pt-6 text-center text-sm"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
          >
            No account?{" "}
            <Link to="/signup" style={{ color: "var(--lime)", fontWeight: 600 }}>
              Create one free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
