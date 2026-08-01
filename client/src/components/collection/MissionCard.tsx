// 일일 미션 카드. 진행중 / 보상받기 / 완료 세 가지 상태
import type { MissionInfo, MissionProgressState } from "@shared/types/mission";
import PixelCard from "../common/PixelCard";
import PixelButton from "../common/PixelButton";

interface MissionCardProps {
  mission: MissionInfo;
  state: MissionProgressState;
  onClaim: () => void;
}

export default function MissionCard({ mission, state, onClaim }: MissionCardProps) {
  const isComplete = state.progress >= mission.target;

  return (
    <PixelCard className="flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-brown">{mission.name}</p>
        <p className="text-sm text-brown/60">
          {state.progress} / {mission.target} - 보상 {mission.reward}
        </p>
      </div>
      {state.claimed ? (
        <span className="shrink-0 rounded-full bg-cream px-4 py-2 text-sm text-brown/40">완료</span>
      ) : isComplete ? (
        <PixelButton onClick={onClaim} className="shrink-0">
          보상받기
        </PixelButton>
      ) : (
        <span className="shrink-0 rounded-full bg-cream px-4 py-2 text-sm text-brown/60">진행 중</span>
      )}
    </PixelCard>
  );
}
