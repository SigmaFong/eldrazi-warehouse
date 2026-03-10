// src/context/AuthContext.tsx
// Function 7.1 — professional structured functional component context
// Function 7.3 — real API, JWT, cross-screen data state

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../services/api';

export interface User {
  _id:   string;
  name:  string;
  email: string;
  role:  'admin' | 'manager' | 'distributor' | 'viewer';
}

interface AuthContextValue {
  user:      User | null;
  token:     string | null;
  loading:   boolean;
  error:     string | null;
  login:     (email: string, password: string) => Promise<void>;
  logout:    () => Promise<void>;
  clearError:() => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          const { data } = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${stored}` },
          });
          // sendSuccess wraps as: { status, data: { user } }
          const u = data.data?.user ?? data.user;
          if (!u) throw new Error('No user in response');
          setUser(u);
          setToken(stored);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      // Backend returns: { status, token, data: { user } }
      // token is at ROOT level, user is inside data
      const t = data.token;
      const u = data.data?.user;
      if (!t) throw new Error('No token received from server');
      await AsyncStorage.setItem(TOKEN_KEY, t);
      setToken(t);
      setUser(u);
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, clearError: () => setError(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}