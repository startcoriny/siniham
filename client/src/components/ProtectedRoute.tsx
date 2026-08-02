// 로그인하지 않았으면 시작 화면으로 되돌림. 세션 확인 중에는 로딩 화면 표시
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingHamster from "./common/LoadingHamster";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { nickname, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingHamster message="로그인 확인 중이에요" />;
  }

  if (!nickname) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
