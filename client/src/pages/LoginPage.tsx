// 설계서 6.2 로그인 화면
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import PixelButton from "../components/common/PixelButton";
import PixelCard from "../components/common/PixelCard";
import LoadingHamster from "../components/common/LoadingHamster";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { nickname: sessionNickname, isLoading: isSessionLoading, login } = useAuth();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      await login(nickname, password);
      // 햄스터가 없으면 GameShell이 온보딩으로 다시 보낸다 (설계서 6.2 로그인 성공 분기).
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <PixelCard className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-brown">로그인</h1>
        <p className="mb-6 text-center text-sm text-brown/70">다시 만나서 반가워요</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="닉네임"
            autoComplete="username"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="rounded-lg border border-brown/20 bg-cream px-4 py-2 text-brown outline-none focus:border-brown/50"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="비밀번호"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-brown/20 bg-cream px-4 py-2 pr-16 text-brown outline-none focus:border-brown/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 text-xs text-brown/60 hover:underline"
            >
              {showPassword ? "숨기기" : "표시"}
            </button>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <PixelButton type="submit" loading={isSubmitting} className="mt-2 w-full">
            로그인
          </PixelButton>
        </form>

        <p className="mt-4 text-center text-sm text-brown/70">
          계정이 없으신가요?{" "}
          <Link to="/signup" className="underline-offset-2 hover:underline">
            회원가입
          </Link>
        </p>
      </PixelCard>
    </div>
  );
}
