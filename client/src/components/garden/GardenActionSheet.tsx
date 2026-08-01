// 선택한 밭의 상태별 정보/액션 패널
import type { GardenPlot } from "@shared/types/garden";
import { HARVEST_REWARD } from "@shared/types/garden";
import PixelCard from "../common/PixelCard";
import PixelButton from "../common/PixelButton";

interface GardenActionSheetProps {
  plot: GardenPlot | null;
  seedCount: number;
  onPlant: () => void;
  onRemoveWeed: () => void;
  onHarvest: () => void;
}

export default function GardenActionSheet({
  plot,
  seedCount,
  onPlant,
  onRemoveWeed,
  onHarvest,
}: GardenActionSheetProps) {
  if (!plot) {
    return <PixelCard className="text-center text-brown/50">밭을 선택해주세요.</PixelCard>;
  }

  return (
    <PixelCard>
      {plot.status === "EMPTY" && (
        <>
          <p className="mb-2 text-brown">빈 밭이에요. 씨앗을 심어보세요.</p>
          <p className="mb-3 text-sm text-brown/60">보유 씨앗 {seedCount}개</p>
          <PixelButton onClick={onPlant} disabled={seedCount < 1} className="w-full">
            심기
          </PixelButton>
        </>
      )}

      {plot.status === "GROWING" && (
        <>
          <p className="mb-3 text-brown">무럭무럭 자라고 있어요.</p>
          {plot.hasWeed && (
            <>
              <p className="mb-3 text-sm text-danger">잡초가 자라고 있어요.</p>
              <PixelButton variant="secondary" onClick={onRemoveWeed} className="w-full">
                잡초 제거
              </PixelButton>
            </>
          )}
        </>
      )}

      {plot.status === "READY" && (
        <>
          <p className="mb-3 text-brown">수확할 수 있어요! (재화 +{HARVEST_REWARD})</p>
          <PixelButton onClick={onHarvest} className="w-full">
            수확하기
          </PixelButton>
        </>
      )}
    </PixelCard>
  );
}
