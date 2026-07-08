"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { apiFetch, setAccessToken, setRefreshHandler } from "./api-client";
import type { User } from "@/types";

interface AuthResponse {
  user: User;
  accessToken: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const refresh = useCallback(async (): Promise<string | null> => {
    try {
      const data = await apiFetch<AuthResponse>("/auth/refresh", { method: "POST", skipAuthRetry: true });
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.accessToken;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setRefreshHandler(refresh);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuthRetry: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: input,
        skipAuthRetry: true,
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST", skipAuthRetry: true }).catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
