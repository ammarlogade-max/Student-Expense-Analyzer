import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "../context/AuthContext";

type Props = {
  children: ReactElement;
};

const ProtectedRoute = ({ children }: Props) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
      >
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold tracking-tight">
            Loading your workspace
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Initializing your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
