import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import { getBudget, updateBudget } from "../lib/api";
import NotificationDebug from "../components/NotificationDebug";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const categories = ["Food", "Shopping", "Transport", "Housing", "Education", "Entertainment", "Health", "Other"];

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

function NavIcon({ kind }: { kind: "dashboard" | "score" | "budget" | "sms" | "onboarding" }) {
  if (kind === "dashboard") {
    return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
  }
  if (kind === "score") {
    return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
  }
  if (kind === "budget") {
    return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
  }
  if (kind === "sms") {
    return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0012.933 5.303M19.5 12A7.5 7.5 0 006.567 6.697M15 3h6v6M9 21H3v-6" /></svg>;
}

const Settings = () => {
  useFeatureTracking("settings", "Viewed settings");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();
  const { isEnabled, isGranted, isUnsupported, requestPermission, disableNotifications } = usePushNotifications();

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});

  const profileFields = [
    { label: "Full Name", value: user?.name || "-" },
    { label: "Email Address", value: user?.email || "-" },
    {
      label: "Member Since",
      value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "-",
    },
  ];

  const quickLinks = [
    { label: "Dashboard", sub: "Overview of your finances", kind: "dashboard" as const, to: "/dashboard" },
    { label: "Finance Score", sub: "View your behavioral score", kind: "score" as const, to: "/score" },
    { label: "Budget", sub: "Read-only tracking page", kind: "budget" as const, to: "/budget" },
    { label: "SMS Parser", sub: "Parse bank transaction SMS", kind: "sms" as const, to: "/sms-parser" },
    {
      label: "Redo Onboarding",
      sub: "Update your profile setup",
      kind: "onboarding" as const,
      action: () => {
        sessionStorage.removeItem("expenseiq_onboarding_done");
        navigate("/onboarding");
      },
    },
  ];

  const totalCategoryBudget = useMemo(
    () => Object.values(categoryBudgets).reduce((sum, value) => sum + value, 0),
    [categoryBudgets]
  );

  const openBudgetModal = async () => {
    setBudgetModalOpen(true);
    setBudgetLoading(true);
    try {
      const { budget } = await getBudget();
      setMonthlyLimit(Math.round(budget.monthlyLimit || 0));
      const next: Record<string, number> = {};
      categories.forEach((cat) => {
        next[cat] = Math.round(Number(budget.categoryBudgets?.[cat] ?? 0));
      });
      setCategoryBudgets(next);
    } catch {
      push("Failed to load budget", "error");
    } finally {
      setBudgetLoading(false);
    }
  };

  const saveBudgetFromSettings = async () => {
    if (!monthlyLimit || monthlyLimit <= 0) {
      push("Monthly budget must be greater than 0", "error");
      return;
    }

    const hasNegative = Object.values(categoryBudgets).some((value) => value < 0);
    if (hasNegative) {
      push("Category budgets cannot be negative", "error");
      return;
    }

    const confirmed = window.confirm("Do you really want to change budget? This will affect your score and budget alerts.");
    if (!confirmed) return;

    setSavingBudget(true);
    try {
      await updateBudget({ monthlyLimit, categoryBudgets });
      sessionStorage.removeItem("expenseiq_cache:budget:overview");
      push("Budget updated from settings", "success");
      setBudgetModalOpen(false);
    } catch {
      push("Failed to update budget", "error");
    } finally {
      setSavingBudget(false);
    }
  };

  useEffect(() => {
    if (!budgetModalOpen) return;
    const ensureAllCategories = { ...categoryBudgets };
    let changed = false;
    categories.forEach((cat) => {
      if (ensureAllCategories[cat] === undefined) {
        ensureAllCategories[cat] = 0;
        changed = true;
      }
    });
    if (changed) setCategoryBudgets(ensureAllCategories);
  }, [budgetModalOpen, categoryBudgets]);

  return (
    <div className="space-y-5 stagger">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Settings
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Manage your profile and account preferences
        </p>
      </div>

      <div className="card card-gradient">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white" style={{ background: "var(--gradient-primary)" }}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              {user?.name || "Student"}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {user?.email}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {profileFields.map((field) => (
            <div key={field.label} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-light)" }}>
              <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                {field.label}
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {field.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Budget Preferences
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Change monthly budget and category split from here only.
            </p>
          </div>
          <button onClick={openBudgetModal} className="btn-secondary" type="button">
            Change Budget
          </button>
        </div>
      </div>

      <NotificationDebug />

      <div className="card !p-0 overflow-hidden">
        <p className="px-5 pb-2 pt-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Quick Navigation
        </p>
        {quickLinks.map((link, index) => (
          <button
            key={link.label}
            onClick={link.to ? () => navigate(link.to) : link.action}
            className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition"
            style={{ borderTop: index > 0 ? "1px solid var(--border-light)" : "none", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-tertiary)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <span style={{ color: "var(--text-tertiary)" }}>
              <NavIcon kind={link.kind} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {link.label}
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {link.sub}
              </p>
            </div>
            <ChevronRight />
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Mobile Notifications
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {isUnsupported
                ? "Not supported on this device/browser"
                : isEnabled
                  ? "Enabled for this device"
                  : isGranted
                    ? "Permission granted but notifications are off for this device"
                    : "Off"}
            </p>
          </div>
          {isEnabled ? (
            <button
              onClick={async () => {
                await disableNotifications();
                push("Mobile notifications turned off", "info");
              }}
              className="btn-secondary"
              style={{ color: "var(--error)", borderColor: "rgba(239,68,68,0.25)" }}
              type="button"
            >
              Turn Off
            </button>
          ) : (
            <button
              onClick={async () => {
                await requestPermission();
                if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                  push("Mobile notifications enabled", "success");
                } else {
                  push("Notification permission not granted", "error");
                }
              }}
              className="btn-primary"
              disabled={isUnsupported}
              type="button"
            >
              Turn On
            </button>
          )}
        </div>
      </div>

      <button onClick={logout} className="btn-secondary w-full" style={{ color: "var(--error)", borderColor: "rgba(239,68,68,0.2)" }} type="button">
        Sign Out
      </button>

      <Modal open={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} title="Change Budget">
        {budgetLoading ? (
          <div className="skeleton h-48" />
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Monthly Budget (₹)
              </label>
              <input
                type="number"
                min={1}
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(Math.max(0, Number(e.target.value) || 0))}
                aria-label="Monthly budget"
              />
            </div>

            <div className="rounded-xl p-3" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-light)" }}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Category Budgets
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {categories.map((cat) => (
                  <label key={cat} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {cat}
                    <input
                      className="mt-1"
                      type="number"
                      min={0}
                      value={categoryBudgets[cat] ?? 0}
                      onChange={(e) =>
                        setCategoryBudgets((prev) => ({
                          ...prev,
                          [cat]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      aria-label={`${cat} budget`}
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                Total category budgets: ₹{totalCategoryBudget.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--warning)" }}>
              Warning: changing budget will affect your Finance Score and alerts.
            </div>

            <button onClick={saveBudgetFromSettings} className="btn-primary w-full" disabled={savingBudget} type="button">
              {savingBudget ? "Saving..." : "Save Budget"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Settings;
