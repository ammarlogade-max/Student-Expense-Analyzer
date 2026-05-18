import { useEffect, useMemo, useState } from "react";
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();
  const { isEnabled, isGranted, isUnsupported, requestPermission, disableNotifications } = usePushNotifications();

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});

  const totalCategoryBudget = useMemo(
    () => Object.values(categoryBudgets).reduce((sum, value) => sum + value, 0),
    [categoryBudgets]
  );

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

      <button onClick={logout} className="btn-secondary w-full" type="button">
        Sign Out
      </button>
    </div>
  );
};

export default Settings;
