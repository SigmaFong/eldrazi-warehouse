import axiosInstance from "./axiosInstance";
import type { User } from "../../types";

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface AuthResponse {
  status: string;
  token:  string;
  data:   { user: User };
}

// ── Token helpers (localStorage persistence) ──────────────────────────────
export const saveToken  = (token: string) => localStorage.setItem("eldrazi_token", token);
export const loadToken  = ()              => localStorage.getItem("eldrazi_token");
export const clearToken = ()              => localStorage.removeItem("eldrazi_token");

// ── Login — POST /auth/login ──────────────────────────────────────────────
export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<AuthResponse>("/auth/login", payload);
  if (data.token) saveToken(data.token);   // persist for page-refresh restore
  return data;
}

// ── Logout — POST /auth/logout ────────────────────────────────────────────
export async function logoutRequest(): Promise<void> {
  try {
    await axiosInstance.post("/auth/logout");
  } finally {
    clearToken();                            // always clear local token
  }
}

// ── Get current user — GET /auth/me ──────────────────────────────────────
export async function getMeRequest(): Promise<User | null> {
  if (!loadToken()) return null;             // no token = skip network call
  try {
    const { data } = await axiosInstance.get<{ data: { user: User } }>("/auth/me");
    return data.data.user;
  } catch {
    clearToken();                            // token invalid/expired
    return null;
  }
}
