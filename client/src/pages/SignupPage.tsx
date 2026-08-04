// 설계서 6.3 회원가입 화면. 이메일 대신 닉네임을 쓰는 것은 프로젝트 결정 사항이다.
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import PixelButton from "../components/common/PixelButton";
import PixelCard from "../components/common/PixelCard";
import LoadingHamster from "../components/common/LoadingHamster";
import { useAuth } from "../context/AuthContext";

// 서버 검증(zod)과 같은 기준. 여기서 먼저 걸러 불필요한 요청을 줄인다.
const NICKNAME_MAX_LENGTH = 20;
const PASSWORD_MIN_LENGTH = 4;

export default function SignupPage() {
  const navigate = useNavigate();
  const { nickname: sessionNickname, isLoading: isSessionLoading, signup } = useAuth();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isSessionLoading) {
    return <LoadingHamster message="로그인 확인 중이에요" />;
  }

  if (sessionNickname) {
    return <Navigate to="/home" replace />;
  }

  function validate(): string | null {
    if (nickname.length > NICKNAME_MAX_LENGTH) {
      return `닉네임은 ${NICKNAME_MAX_LENGTH}자까지 쓸 수 있어요.`;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 해요.`;
    }
    if (password !== passwordConfirm) {
      return "비밀번호가 서로 달라요.";
    }
    if (!agreed) {
      return "이용약관과 개인정보처리방침에 동의해 주세요.";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signup(nickname, password);
      // 가입 직후에는 햄스터가 없으므로 바로 온보딩으로 보낸다 (설계서 6.3).
      navigate("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-8">
      <PixelCard className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-brown">회원가입</h1>
        <p className="mb-6 text-center text-sm text-brown/70">햄스터와 함께할 준비 됐나요?</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            required
            maxLength={NICKNAME_MAX_LENGTH}
            placeholder="닉네임"
            autoComplete="username"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="rounded-lg border border-brown/20 bg-cream px-4 py-2 text-brown outline-none focus:border-brown/50"
          />
          <input
            type="password"
            required
            placeholder={`비밀번호 (${PASSWORD_MIN_LENGTH}자 이상)`}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-brown/20 bg-cream px-4 py-2 text-brown outline-none focus:border-brown/50"
          />
          <input
            type="password"
            required
            placeholder="비밀번호 확인"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="rounded-lg border border-brown/20 bg-cream px-4 py-2 text-brown outline-none focus:border-brown/50"
          />

          <label className="flex items-start gap-2 text-sm text-brown/70">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <span>
              <Link to="/terms" className="underline underline-offset-2">
                이용약관
              </Link>
              과{" "}
              <Link to="/privacy" className="underline underline-offset-2">
                개인정보처리방침
              </Link>
              에 동의합니다. (필수)
            </span>
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <PixelButton type="submit" loading={isSubmitting} className="mt-2 w-full">
            회원가입
          </PixelButton>
        </form>

        <p className="mt-4 text-center text-sm text-brown/70">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="underline-offset-2 hover:underline">
            로그인
          </Link>
        </p>
      </PixelCard>
    </div>
  );
}
