import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import { getBudget, updateBudget } from "../lib/api";
import { useFeatureTracking } from "../hooks/useFeatureTracking";

const categories = ["Food", "Shopping", "Transport", "Housing", "Education", "Entertainment", "Health", "Other"];

const Settings = () => {
  useFeatureTracking("settings", "Viewed settings");

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { push } = useToast();

  const {
    isEnabled,
    isGranted,
    isUnsupported,
    requestPermission,
    disableNotifications,
  } = usePushNotifications();

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});

  const totalCategoryBudget = useMemo(() => {
    return Object.values(categoryBudgets).reduce((sum, value) => sum + value, 0);
  }, [categoryBudgets]);

  const openBudgetModal = async () => {
    try {
      const { budget } = await getBudget();

      setMonthlyLimit(Math.round(budget.monthlyLimit || 0));

      const next: Record<string, number> = {};

      categories.forEach((category) => {
        next[category] = Math.round(Number(budget.categoryBudgets?.[category] ?? 0));
      });

      setCategoryBudgets(next);
      setBudgetModalOpen(true);
    } catch {
      push("Failed to load budget", "error");
    }
  };

  const saveBudget = async () => {
    setSavingBudget(true);

    try {
      await updateBudget({
        monthlyLimit,
        categoryBudgets,
      });

      push("Budget updated", "success");
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
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm mt-1">Manage app preferences</p>
      </div>

      <div className="card">
        <h2 className="font-semibold">{user?.name || "Student"}</h2>
        <p className="text-sm">{user?.email}</p>
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Budget</h3>
          <p className="text-xs">Manage budget settings</p>
        </div>

        <button onClick={openBudgetModal} className="btn-primary">
          Edit
        </button>
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-xs">
            {isUnsupported
              ? "Unsupported"
              : isEnabled
              ? "Enabled"
              : isGranted
              ? "Permission granted"
              : "Disabled"}
          </p>
        </div>

        {isEnabled ? (
          <button
            className="btn-secondary"
            onClick={async () => {
              await disableNotifications();
            }}
          >
            Disable
          </button>
        ) : (
          <button
            className="btn-primary"
            disabled={isUnsupported}
            onClick={async () => {
              await requestPermission();
            }}
          >
            Enable
          </button>
        )}
      </div>

      <div className="card space-y-3">
        <button onClick={() => navigate("/score")} className="btn-secondary w-full">
          Open Score
        </button>

        <button onClick={() => navigate("/budget")} className="btn-secondary w-full">
          Open Budget
        </button>
      </div>

      <button onClick={logout} className="btn-secondary w-full">
        Sign Out
      </button>

      <Modal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        title="Update Budget"
      >
        <div className="space-y-4">
          <input
            type="number"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(Number(e.target.value) || 0)}
            placeholder="Monthly Budget"
          />

          {categories.map((category) => (
            <input
              key={category}
              type="number"
              value={categoryBudgets[category] ?? 0}
              onChange={(e) =>
                setCategoryBudgets((prev) => ({
                  ...prev,
                  [category]: Number(e.target.value) || 0,
                }))
              }
              placeholder={category}
            />
          ))}

          <p className="text-xs">
            Total category budget: ₹{totalCategoryBudget}
          </p>

          <button
            onClick={saveBudget}
            disabled={savingBudget}
            className="btn-primary w-full"
          >
            {savingBudget ? "Saving..." : "Save Budget"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
