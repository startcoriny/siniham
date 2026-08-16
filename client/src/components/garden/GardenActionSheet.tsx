import type { GameStatePlot } from "@shared/types/gameState";
import { CROP_MASTERS } from "@shared/types/garden";
import type { CropId } from "@shared/types/garden";
import PixelButton from "../common/PixelButton";

interface Props {
  plot: GameStatePlot | null;
  selectedCropId: CropId;
  seedCount: number;
  now: number;
  busy?: boolean;
  onPlant: () => void;
  onRemoveWeed: () => void;
  onWater: () => void;
  onHarvest: () => void;
  onClearPlot: () => void;
}

function remainingText(plot: GameStatePlot, now: number) {
  if (!plot.cropId || !plot.plantedAt) return "";
  const duration = CROP_MASTERS[plot.cropId].growDurationMs * (plot.hasWeed ? 1.2 : 1);
  const minutes = Math.ceil(Math.max(0, duration - (now - plot.plantedAt)) / 60_000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분 남음` : `${minutes}분 남음`;
}

export default function GardenActionSheet({ plot, selectedCropId, seedCount, now, busy = false, onPlant, onRemoveWeed, onWater, onHarvest, onClearPlot }: Props) {
  if (!plot) return <p className="garden-action-hint">밭 칸을 선택해 주세요.</p>;
  if (plot.hasWeed) return (
    <div className="garden-action-buttons">
      <PixelButton onClick={onRemoveWeed} disabled={busy} className="garden-main-action" variant="secondary">잡초 뽑기</PixelButton>
      {plot.status === "GROWING" && <PixelButton onClick={onWater} disabled={busy} className="garden-main-action">물주기</PixelButton>}
      <PixelButton onClick={onClearPlot} disabled={busy} className="garden-clear-action" variant="secondary">밭 비우기</PixelButton>
    </div>
  );
  if (plot.status === "READY") return <div className="garden-action-buttons"><PixelButton onClick={onHarvest} disabled={busy} className="garden-main-action">수확하기</PixelButton><PixelButton onClick={onClearPlot} disabled={busy} className="garden-clear-action" variant="secondary">밭 비우기</PixelButton></div>;
  if (plot.status === "GROWING" && plot.cropId) return (
    <div>
      <p className="garden-action-hint"><strong>{CROP_MASTERS[plot.cropId].name}</strong>&nbsp;·&nbsp;{remainingText(plot, now)}</p>
      <div className="garden-action-buttons"><PixelButton onClick={onWater} disabled={busy} className="garden-main-action">물주기</PixelButton><PixelButton onClick={onClearPlot} disabled={busy} className="garden-clear-action" variant="secondary">밭 비우기</PixelButton></div>
    </div>
  );
  const crop = CROP_MASTERS[selectedCropId];
  return <PixelButton onClick={onPlant} disabled={seedCount < 1 || busy} className="garden-main-action">{busy ? "햄스터가 작업 중이에요" : seedCount > 0 ? `${crop.name} 심기` : "씨앗이 없어요"}</PixelButton>;
}
