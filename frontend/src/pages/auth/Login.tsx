import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">
            ExpenseIQ
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Welcome back. Your finances are waiting.
          </h1>
          <p className="text-sm text-slate-300">
            Log in to see your dashboard, analytics, and budget insights in one
            beautiful workspace.
          </p>
          <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
            <p className="text-sm text-slate-200">
              “The smartest way to keep my student budget on track.”
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-emerald-200">
              Finance Club Review
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 text-slate-900 shadow-2xl">
          <h2 className="text-2xl font-semibold">Login</h2>
          <p className="text-sm text-slate-500">
            Access all your personalized insights.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
              required
            />

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Need an account?{" "}
            <Link className="font-semibold text-emerald-600" to="/signup">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
