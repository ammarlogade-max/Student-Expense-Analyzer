import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { ReactNode } from "react";
import type { User } from "../lib/types";
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  refreshSession,
  signup as apiSignup
} from "../lib/api";
import {
  getRefreshToken,
  getStoredUser,
  getToken,
  setRefreshToken,
  setStoredUser,
  setToken
} from "../lib/storage";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setUser(null);
      setTokenState(null);
      setLoading(false);
      return;
    }

    try {
      const { user: me } = await getMe();
      setUser(me);
      setStoredUser(me);
      setTokenState(currentToken);
    } catch {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshed = await refreshSession(refreshToken);
          setToken(refreshed.token);
          setRefreshToken(refreshed.refreshToken);
          setTokenState(refreshed.token);
          const { user: me } = await getMe();
          setUser(me);
          setStoredUser(me);
        } catch {
          setUser(null);
          setStoredUser(null);
          setTokenState(null);
          setToken(null);
          setRefreshToken(null);
        }
      } else {
        setUser(null);
        setStoredUser(null);
        setTokenState(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setToken(result.token);
    setRefreshToken(result.refreshToken);
    setTokenState(result.token);
    setUser(result.user);
    setStoredUser(result.user);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      await apiSignup(name, email, password);
      const result = await apiLogin(email, password);
      setToken(result.token);
      setRefreshToken(result.refreshToken);
      setTokenState(result.token);
      setUser(result.user);
      setStoredUser(result.user);
    },
    []
  );

  const logout = useCallback(() => {
    apiLogout().catch(() => undefined);
    setUser(null);
    setStoredUser(null);
    setTokenState(null);
    setToken(null);
    setRefreshToken(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await hydrate();
  }, [hydrate]);

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout, refresh }),
    [user, token, loading, login, signup, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
