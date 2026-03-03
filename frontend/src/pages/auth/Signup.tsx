import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(formData.name, formData.email, formData.password);
      navigate("/onboarding");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-[120px]"
          style={{ background: "rgba(99,102,241,0.14)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-1 text-4xl font-black">
            <span style={{ color: "var(--primary)" }}>Expense</span>
            <span style={{ color: "var(--text-primary)" }}>IQ</span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            AI-powered finance for students
          </p>
        </div>

        <div
          className="rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-medium)" }}
        >
          <h2 className="mb-1 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Create Account
          </h2>
          <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            Start your expense tracking journey in minutes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Creating account...
                </>
              ) : (
                "Create Account ->"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link className="font-semibold" style={{ color: "var(--primary)" }} to="/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
