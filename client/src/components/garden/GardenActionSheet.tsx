// 선택한 심기 슬롯의 상태에 맞는 행동과 성장 정보를 제공한다.
import type { GameStatePlot } from "@shared/types/gameState";
import { CROP_MASTERS } from "@shared/types/garden";
import type { CropId } from "@shared/types/garden";
import PixelButton from "../common/PixelButton";

interface Props { plot: GameStatePlot | null; selectedCropId: CropId; seedCount: number; now: number; onPlant: () => void; onRemoveWeed: () => void; onHarvest: () => void; }

function remainingText(plot: GameStatePlot, now: number) {
  if (!plot.cropId || !plot.plantedAt) return "";
  const duration = CROP_MASTERS[plot.cropId].growDurationMs * (plot.hasWeed ? 1.2 : 1);
  const minutes = Math.ceil(Math.max(0, duration - (now - plot.plantedAt)) / 60_000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분 남음` : `${minutes}분 남음`;
}

export default function GardenActionSheet({ plot, selectedCropId, seedCount, now, onPlant, onRemoveWeed, onHarvest }: Props) {
  if (!plot) return <p className="garden-action-hint">심을 칸을 선택해주세요.</p>;
  if (plot.hasWeed) return <PixelButton onClick={onRemoveWeed} className="garden-main-action" variant="secondary">잡초 뽑기</PixelButton>;
  if (plot.status === "READY") return <PixelButton onClick={onHarvest} className="garden-main-action">수확하기</PixelButton>;
  if (plot.status === "GROWING" && plot.cropId) return <p className="garden-action-hint"><strong>{CROP_MASTERS[plot.cropId].name}</strong>&nbsp;·&nbsp;{remainingText(plot, now)}</p>;
  const crop = CROP_MASTERS[selectedCropId];
  return <PixelButton onClick={onPlant} disabled={seedCount < 1} className="garden-main-action">{seedCount > 0 ? `${crop.name} 심기` : "씨앗이 없어요"}</PixelButton>;
}
