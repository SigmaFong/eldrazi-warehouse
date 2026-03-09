import {
  createContext, useContext, useState,
  useEffect, useCallback, type ReactNode,
} from "react";
import type { User, AuthState } from "../types";
import {
  loginRequest, logoutRequest, getMeRequest,
  type LoginPayload,
} from "../api/auth";

interface AuthContextValue extends AuthState {
  login:  (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on mount ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const me = await getMeRequest();  // uses axiosInstance + stored token
      if (me) setUser(me);
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await loginRequest(payload);   // throws on 401/400
    setToken(res.token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();                     // blacklists token on backend
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
