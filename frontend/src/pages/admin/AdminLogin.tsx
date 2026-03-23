import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">
            Admin Access
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Operate the platform with real-time product and ML visibility.
          </h1>
          <p className="max-w-xl text-sm text-slate-300">
            Monitor user adoption, expense volume, model performance, and system
            health from the secured control center.
          </p>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-200">
              Default bootstrap admin is created automatically on first use if no
              admin exists.
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-200">
              Email: admin@expenseiq.local
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
              Password: Admin@123456
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 text-slate-900 shadow-2xl">
          <h2 className="text-2xl font-semibold">Admin Login</h2>
          <p className="mt-1 text-sm text-slate-500">
            Protected access for operations and analytics.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              setLoading(true);

              try {
                await login(formData.email, formData.password);
                navigate("/admin/dashboard");
              } catch (submitError) {
                setError(getErrorMessage(submitError, "Admin login failed"));
              } finally {
                setLoading(false);
              }
            }}
          >
            <input
              type="email"
              placeholder="Admin email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-cyan-400 focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-cyan-400 focus:outline-none"
              required
            />
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Open Admin Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
