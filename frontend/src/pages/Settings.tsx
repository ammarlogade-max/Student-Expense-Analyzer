import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import { getBudget, updateBudget } from "../lib/api";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const categories = ["Food", "Shopping", "Transport", "Housing", "Education", "Entertainment", "Health", "Other"];

const quickActions = [
  {
    title: "Finance Score",
    subtitle: "View financial behavior score",
    path: "/score",
  },
  {
    title: "Budget Overview",
    subtitle: "Manage monthly spending",
    path: "/budget",
  },
  {
    title: "Dashboard",
    subtitle: "See complete expense overview",
    path: "/dashboard",
  },
];

const Settings = () => {
  useFeatureTracking("settings", "Viewed settings");

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { push } = useToast();
  const { isEnabled, isGranted, isUnsupported, requestPermission, disableNotifications } = usePushNotifications();

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});

  const totalCategoryBudget = useMemo(
    () => Object.values(categoryBudgets).reduce((sum, value) => sum + value, 0),
    [categoryBudgets]
  );

  const openBudgetModal = async () => {
    try {
      const { budget } = await getBudget();

      setMonthlyLimit(Math.round(budget.monthlyLimit || 0));

      const next: Record<string, number> = {};

      categories.forEach((cat) => {
        next[cat] = Math.round(Number(budget.categoryBudgets?.[cat] ?? 0));
      });

      setCategoryBudgets(next);
      setBudgetModalOpen(true);
    } catch {
      push("Failed to load budget", "error");
    }
  };

  const saveBudget = async () => {
    if (monthlyLimit <= 0) {
      push("Enter a valid monthly budget", "error");
      return;
    }

    setSavingBudget(true);

    try {
      await updateBudget({
        monthlyLimit,
        categoryBudgets,
      });

      push("Budget updated successfully", "success");
      setBudgetModalOpen(false);
    } catch {
      push("Failed to update budget", "error");
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
          }}
        >
          Settings
        </h1>

        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Manage account preferences and app settings
        </p>
      </div>

      <div className="card card-gradient">
        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="min-w-0">
            <h2
              className="text-lg font-bold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.name || "Student"}
            </h2>

            <p
              className="text-sm truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Budget Settings
            </h3>

            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Manage monthly budget and category limits
            </p>
          </div>

          <button onClick={openBudgetModal} className="btn-primary">
            Edit
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Notifications
            </h3>

            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              {isUnsupported
                ? "Notifications are not supported"
                : isEnabled
                ? "Notifications enabled"
                : isGranted
                ? "Permission granted but disabled"
                : "Notifications disabled"}
            </p>
          </div>

          {isEnabled ? (
            <button
              className="btn-secondary shrink-0"
              onClick={async () => {
                await disableNotifications();
                push("Notifications disabled", "info");
              }}
            >
              Disable
            </button>
          ) : (
            <button
              className="btn-primary shrink-0"
              disabled={isUnsupported}
              onClick={async () => {
                await requestPermission();
              }}
            >
              Enable
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3
          className="text-base font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Quick Access
        </h3>

        <div className="space-y-3">
          {quickActions.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className="w-full rounded-2xl p-4 text-left transition"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <p
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {item.title}
              </p>

              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                {item.subtitle}
              </p>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={logout}
        className="btn-secondary w-full"
        style={{ color: "var(--error)" }}
      >
        Sign Out
      </button>

      <Modal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        title="Update Budget"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-2">
              Monthly Budget
            </label>

            <input
              type="number"
              min={1}
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(Number(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category}>
                <label className="text-xs block mb-1">{category}</label>

                <input
                  type="number"
                  min={0}
                  value={categoryBudgets[category] ?? 0}
                  onChange={(e) =>
                    setCategoryBudgets((prev) => ({
                      ...prev,
                      [category]: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Total category budget: ₹{totalCategoryBudget.toLocaleString("en-IN")}
          </p>

          <button
            onClick={saveBudget}
            className="btn-primary w-full"
            disabled={savingBudget}
          >
            {savingBudget ? "Saving..." : "Save Budget"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
