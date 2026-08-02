// 일일 미션 탭 상단 요약 (설계서 6.9 "오늘 남은 미션 수, 자정까지 남은 시간")
import { useEffect, useState } from "react";

interface Props {
  remainingCount: number;
  // 서버가 계산한 한국 자정까지 남은 시간. 응답 시점 기준이라 화면에서 경과분을 빼서 표시한다.
  resetInMs: number;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "곧 갱신돼요";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours === 0 && minutes === 0) return "1분 미만";
  if (hours === 0) return `${minutes}분`;
  return `${hours}시간 ${minutes}분`;
}

export default function MissionSummary({ remainingCount, resetInMs }: Props) {
  const [remainingMs, setRemainingMs] = useState(resetInMs);

  useEffect(() => {
    const receivedAt = Date.now();
    setRemainingMs(resetInMs);
    const timer = setInterval(() => {
      setRemainingMs(Math.max(0, resetInMs - (Date.now() - receivedAt)));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetInMs]);

  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl bg-card px-4 py-3 text-sm shadow-sm">
      <span className="font-medium text-brown">
        {remainingCount === 0 ? "오늘 미션을 모두 마쳤어요" : `오늘 남은 미션 ${remainingCount}개`}
      </span>
      <span className="text-brown/60">자정까지 {formatRemaining(remainingMs)}</span>
    </div>
  );
}
