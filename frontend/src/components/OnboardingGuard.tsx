import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getOnboardingStatus } from "../lib/api";

interface Props {
  children: ReactNode;
}

/**
 * OnboardingGuard
 * Wraps all dashboard routes. On first load, checks if the
 * logged-in user has completed onboarding. If not, redirects
 * them to /onboarding.
 *
 * Result is cached in sessionStorage so we don't hit the API
 * on every route change within the session.
 */
const OnboardingGuard = ({ children }: Props) => {
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    // Session cache - only check once per tab session
    const cached = sessionStorage.getItem("expenseiq_onboarding_done");
    if (cached === "true") {
      setChecking(false);
      return;
    }

    getOnboardingStatus()
      .then(({ onboardingDone }) => {
        if (onboardingDone) {
          sessionStorage.setItem("expenseiq_onboarding_done", "true");
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      })
      .catch(() => {
        // If check fails, let them through - don't block the app
        setNeedsOnboarding(false);
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2"
            style={{
              borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)",
              borderTopColor: "var(--primary)",
            }}
          />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading ExpenseIQ...
          </p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;
