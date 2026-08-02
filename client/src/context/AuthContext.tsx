// 실제 인증 세션. httpOnly 쿠키 기반이라 앱 시작 시 /api/auth/me로 세션 유무를 확인한다.
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@shared/types/auth";
import { fetchMe, login as apiLogin, logout as apiLogout, signup as apiSignup } from "../lib/api";

interface AuthContextValue {
  nickname: string | null;
  isLoading: boolean;
  login: (nickname: string, password: string) => Promise<void>;
  signup: (nickname: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(nickname: string, password: string) {
    const res = await apiLogin({ nickname, password });
    setUser(res.user);
  }

  async function signup(nickname: string, password: string) {
    const res = await apiSignup({ nickname, password });
    setUser(res.user);
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ nickname: user?.nickname ?? null, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}
