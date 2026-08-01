// 목업 로그인 세션. localStorage에 닉네임만 저장해 새로고침에도 유지
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { mockLogin, mockSignup } from "../mocks/mockAuth";

const SESSION_KEY = "siniham-mock-session";

interface AuthContextValue {
  nickname: string | null;
  login: (nickname: string, password: string) => boolean;
  signup: (nickname: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [nickname, setNickname] = useState<string | null>(() =>
    localStorage.getItem(SESSION_KEY),
  );

  function login(inputNickname: string, password: string): boolean {
    if (!mockLogin(inputNickname, password)) return false;
    localStorage.setItem(SESSION_KEY, inputNickname);
    setNickname(inputNickname);
    return true;
  }

  function signup(inputNickname: string, password: string): boolean {
    if (!mockSignup(inputNickname, password)) return false;
    localStorage.setItem(SESSION_KEY, inputNickname);
    setNickname(inputNickname);
    return true;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setNickname(null);
  }

  return (
    <AuthContext.Provider value={{ nickname, login, signup, logout }}>
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
