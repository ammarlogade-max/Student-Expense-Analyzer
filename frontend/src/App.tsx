import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import OnboardingGuard from "./components/OnboardingGuard";  // NEW
import { useCapacitorNotifications } from "./hooks/useCapacitorNotifications";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Analytics = lazy(() => import("./pages/Analytics"));
const BudgetPage = lazy(() => import("./pages/Budget"));
const SmsParser = lazy(() => import("./pages/SmsParser"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const Cash = lazy(() => import("./pages/Cash"));
const Onboarding = lazy(() => import("./pages/Onboarding")); // NEW
const Score = lazy(() => import("./pages/Score")); // from step 4
const NotificationVoice = lazy(() => import("./pages/NotificationVoice"));
const NotificationText = lazy(() => import("./pages/NotificationText"));
const SmsAuto = lazy(() => import("./pages/SmsAuto"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-primary)" }}>
    <div className="card w-full max-w-sm text-center">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Loading...
      </p>
    </div>
  </div>
);

function App() {
  useCapacitorNotifications();

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Onboarding — protected but NOT inside DashboardLayout */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* All dashboard routes — wrapped in OnboardingGuard to redirect
            new users who haven't completed onboarding */}
        <Route
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <DashboardLayout />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        >
          {/* Step 6: Notification action popups */}
<Route path="/notification-voice" element={<NotificationVoice />} />
<Route path="/notification-text" element={<NotificationText />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/cash" element={<Cash />} />
          <Route path="/sms-parser" element={<SmsParser />} />
          <Route path="/sms-auto" element={<SmsAuto />} />
          <Route path="/score" element={<Score />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
