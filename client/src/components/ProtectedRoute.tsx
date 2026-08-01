// 로그인하지 않았으면 시작 화면으로 되돌림
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { nickname } = useAuth();

  if (!nickname) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
