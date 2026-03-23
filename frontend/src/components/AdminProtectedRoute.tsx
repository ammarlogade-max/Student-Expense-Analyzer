import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";

type Props = {
  children: ReactElement;
};

const AdminProtectedRoute = ({ children }: Props) => {
  const { token, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold tracking-tight">
            Loading admin workspace
          </p>
          <p className="text-sm text-slate-300">
            Syncing operational metrics...
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
