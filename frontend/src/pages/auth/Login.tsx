import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try { await login(form.email, form.password); navigate("/dashboard"); }
    catch (err: any) { setError(err.message || "Login failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:"var(--bg-primary)" }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full opacity-20"
          style={{ background:"radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)", filter:"blur(80px)" }}/>
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full opacity-15"
          style={{ background:"radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%)", filter:"blur(60px)" }}/>
      </div>

      <div className="relative w-full max-w-[900px] mx-auto grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
        {/* Left: branding */}
        <div className="hidden lg:block space-y-6 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background:"var(--gradient-primary)" }}>
              <span className="text-sm font-black text-white">IQ</span>
            </div>
            <span className="text-xl font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>ExpenseIQ</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight" style={{ color:"var(--text-primary)", fontFamily:"var(--font-display)" }}>
            Your finances,<br/>finally under control.
          </h1>
          <p className="text-base" style={{ color:"var(--text-secondary)" }}>
            AI-powered expense tracking built specifically for Indian students. Voice logging, SMS parsing, and behavioral insights — all in one place.
          </p>
          <div className="rounded-2xl p-5 space-y-3" style={{ background:"var(--bg-secondary)", border:"1px solid var(--border-light)" }}>
            {[
              { icon:"🎙️", text:"Voice-powered expense entry" },
              { icon:"📱", text:"Automatic SMS bank parsing" },
              { icon:"🏆", text:"Behavioral Finance Score system" },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 text-sm" style={{ color:"var(--text-secondary)" }}>
                <span className="text-base">{f.icon}</span> {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="animate-fade-up w-full" style={{ animationDelay:"100ms" }}>
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background:"var(--gradient-primary)" }}>
              <span className="text-sm font-black text-white">IQ</span>
            </div>
            <span className="text-xl font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>ExpenseIQ</span>
          </div>

          <div className="rounded-2xl p-7 shadow-2xl" style={{ background:"var(--bg-secondary)", border:"1px solid var(--border-medium)" }}>
            <h2 className="text-2xl font-bold mb-1" style={{ color:"var(--text-primary)", fontFamily:"var(--font-display)" }}>Welcome back</h2>
            <p className="text-sm mb-6" style={{ color:"var(--text-secondary)" }}>Sign in to your ExpenseIQ account</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color:"var(--text-secondary)" }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})}
                  placeholder="you@example.com" required autoComplete="email"/>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color:"var(--text-secondary)" }}>Password</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})}
                  placeholder="••••••••" required autoComplete="current-password"/>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2" style={{ marginTop:8 }}>
                {loading ? "Signing in…" : "Sign in →"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm" style={{ color:"var(--text-tertiary)" }}>
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold transition" style={{ color:"var(--primary)" }}>Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
