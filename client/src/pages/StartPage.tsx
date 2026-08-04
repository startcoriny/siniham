// 설계서 6.1 시작 화면. 로그인/회원가입으로 유도하고 대표 햄스터를 연출한다.
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { HamsterBehavior } from "@shared/types/hamster";
import PixelButton from "../components/common/PixelButton";
import LoadingHamster from "../components/common/LoadingHamster";
import HamsterSprite from "../components/hamster/HamsterSprite";
import { useAuth } from "../context/AuthContext";

const WALK_DURATION_MS = 2200;
const PAUSE_DURATION_MS = 1400;
// 무대 좌우 여백. 스프라이트가 화면 밖으로 나가지 않도록 비율 범위를 제한한다.
const MIN_POSITION = 8;
const MAX_POSITION = 82;

interface Stage {
  position: number;
  facing: "left" | "right";
  behavior: HamsterBehavior;
}

function randomPosition(current: number): number {
  // 지금 자리에서 충분히 떨어진 곳을 골라야 걷는 게 눈에 보인다.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const next = MIN_POSITION + Math.random() * (MAX_POSITION - MIN_POSITION);
    if (Math.abs(next - current) > 20) return next;
  }
  return current > (MIN_POSITION + MAX_POSITION) / 2 ? MIN_POSITION : MAX_POSITION;
}

export default function StartPage() {
  const navigate = useNavigate();
  const { nickname, isLoading } = useAuth();
  const [stage, setStage] = useState<Stage>({ position: 20, facing: "right", behavior: "IDLE" });

  useEffect(() => {
    // 모바일은 성능을 위해 걷기 한 종류만 돌리고, 접근성 설정이 있으면 아예 멈춘다 (설계서 6.1).
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    let cancelled = false;
    let timer = 0;

    function walk() {
      if (cancelled) return;
      setStage((current) => {
        const target = randomPosition(current.position);
        return {
          position: target,
          facing: target < current.position ? "left" : "right",
          behavior: "WALK",
        };
      });
      timer = window.setTimeout(pause, WALK_DURATION_MS);
    }

    function pause() {
      if (cancelled) return;
      // 걸음을 멈추면 잠시 앉아 있고, PC에서는 가끔 사용자 쪽을 바라본다.
      const behavior: HamsterBehavior = !isMobile && Math.random() < 0.4 ? "USER_LOOK" : "IDLE";
      setStage((current) => ({ ...current, behavior }));
      timer = window.setTimeout(walk, PAUSE_DURATION_MS);
    }

    timer = window.setTimeout(walk, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (isLoading) {
    return <LoadingHamster message="로그인 확인 중이에요" />;
  }

  if (nickname) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-brown">시니햄</h1>
        <p className="mt-2 text-center text-sm text-brown/70">
          작은 케이지 속 햄스터와 느긋하게 지내는 시간
        </p>

        <div className="relative mt-6 h-32 overflow-hidden rounded-2xl bg-card">
          <div
            className="absolute bottom-3 transition-[left] ease-linear"
            style={{ left: `${stage.position}%`, transitionDuration: `${WALK_DURATION_MS}ms` }}
          >
            <HamsterSprite
              appearance="GOLDEN"
              behavior={stage.behavior}
              facing={stage.facing}
              size={72}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <PixelButton className="w-full" onClick={() => navigate("/signup")}>
            회원가입
          </PixelButton>
          <PixelButton variant="secondary" className="w-full" onClick={() => navigate("/login")}>
            로그인
          </PixelButton>
        </div>

        <p className="mt-6 text-center text-xs text-brown/50">
          <Link to="/terms" className="hover:underline">
            이용약관
          </Link>
          <span className="mx-2">·</span>
          <Link to="/privacy" className="hover:underline">
            개인정보처리방침
          </Link>
        </p>
      </div>
    </div>
  );
}
