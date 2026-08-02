// 기획서 화면 1. 로그인/회원가입 (한 화면에서 모드 전환)
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import PixelButton from "../components/common/PixelButton";
import PixelCard from "../components/common/PixelCard";
import LoadingHamster from "../components/common/LoadingHamster";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "signup";

export default function AuthPage() {
  const navigate = useNavigate();
  const { nickname: sessionNickname, isLoading: isSessionLoading, login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isSessionLoading) {
    return <LoadingHamster message="로그인 확인 중이에요" />;
  }

  if (sessionNickname) {
    return <Navigate to="/home" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(nickname, password);
      } else {
        await signup(nickname, password);
      }
      navigate(mode === "signup" ? "/onboarding" : "/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <PixelCard className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-brown">시니햄</h1>
        <p className="mb-6 text-center text-sm text-brown/70">
          {mode === "login" ? "다시 만나서 반가워요" : "햄스터와 함께할 준비 됐나요?"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="rounded-lg border border-brown/20 bg-cream px-4 py-2 text-brown outline-none focus:border-brown/50"
          />
          <input
            type="password"
            required
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-brown/20 bg-cream px-4 py-2 text-brown outline-none focus:border-brown/50"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <PixelButton type="submit" loading={isSubmitting} className="mt-2 w-full">
            {mode === "login" ? "로그인" : "회원가입"}
          </PixelButton>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="mt-4 w-full text-center text-sm text-brown/70 underline-offset-2 hover:underline"
        >
          {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
        </button>
      </PixelCard>
    </div>
  );
}
