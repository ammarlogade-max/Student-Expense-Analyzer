/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { ReactNode } from "react";
import type { AdminUser } from "../lib/types";
import { adminLogin as apiAdminLogin, getAdminOverview } from "../lib/adminApi";
import {
  getAdminToken,
  getStoredAdmin,
  setAdminToken,
  setStoredAdmin
} from "../lib/storage";

type AdminAuthState = {
  admin: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(getStoredAdmin());
  const [token, setTokenState] = useState<string | null>(getAdminToken());
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const currentToken = getAdminToken();
    if (!currentToken) {
      setAdmin(null);
      setTokenState(null);
      setLoading(false);
      return;
    }

    try {
      await getAdminOverview();
      setAdmin(getStoredAdmin());
      setTokenState(currentToken);
    } catch {
      setAdmin(null);
      setStoredAdmin(null);
      setTokenState(null);
      setAdminToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiAdminLogin(email, password);
    setAdminToken(result.token);
    setStoredAdmin(result.admin);
    setTokenState(result.token);
    setAdmin(result.admin);
  }, []);

  const logout = useCallback(() => {
    setAdmin(null);
    setStoredAdmin(null);
    setTokenState(null);
    setAdminToken(null);
  }, []);

  const value = useMemo(
    () => ({ admin, token, loading, login, logout }),
    [admin, token, loading, login, logout]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }
  return ctx;
}
