import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import OnboardingGuard from "./components/OnboardingGuard";
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
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Score = lazy(() => import("./pages/Score"));
const NotificationVoice = lazy(() => import("./pages/NotificationVoice"));
const NotificationText = lazy(() => import("./pages/NotificationText"));
const SmsAuto = lazy(() => import("./pages/SmsAuto"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminMl = lazy(() => import("./pages/admin/AdminMl"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem"));

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
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <DashboardLayout />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          >
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

          <Route
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/ml" element={<AdminMl />} />
            <Route path="/admin/system" element={<AdminSystem />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
