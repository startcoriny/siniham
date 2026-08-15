// 정원의 개별 심기 슬롯. 작물 상태와 잡초를 픽셀 아틀라스로 표시한다.
import type { CSSProperties } from "react";
import type { GameStatePlot } from "@shared/types/gameState";
import type { CropId } from "@shared/types/garden";
import { CROP_MASTERS } from "@shared/types/garden";

// 심은 뒤 이 비율만큼 시간이 지나기 전까지는 새싹 단계로 보여준다. 정확한 수치는 정해진 바 없어 절반으로 임시 결정.
const SPROUT_STAGE_RATIO = 0.5;
const SEEDED_STAGE_RATIO = 0.15;

export const GARDEN_CROPS: Array<{ id: CropId; name: string; atlasX: string; offsetX: string; sproutY: string; growY: string; readyY: string }> = [
  // Y 보정은 그림 중심이 아니라 스프라이트의 흙 하단이 슬롯 중앙에 오도록 맞춘 값이다.
  { id: "CARROT", name: "당근", atlasX: "0%", offsetX: "-7%", sproutY: "-8%", growY: "-5%", readyY: "-9%" },
  { id: "STRAWBERRY", name: "딸기", atlasX: "33.333%", offsetX: "0%", sproutY: "-8%", growY: "-8%", readyY: "-9%" },
  { id: "TOMATO", name: "토마토", atlasX: "66.667%", offsetX: "10%", sproutY: "-8%", growY: "-8%", readyY: "-9%" },
  { id: "SUNFLOWER", name: "해바라기", atlasX: "100%", offsetX: "15%", sproutY: "-8%", growY: "-8%", readyY: "-9%" },
];

export function gardenSpriteStyle(atlasX: string, atlasY: string, offsetX = "0%", offsetY = "0%"): CSSProperties {
  return { "--garden-sprite-x": atlasX, "--garden-sprite-y": atlasY, "--garden-offset-x": offsetX, "--garden-offset-y": offsetY } as CSSProperties;
}

type PreviewStage = "SEEDED" | "SPROUT" | "GROWING" | "READY";

export default function GardenPlotTile({ plot, selected, onSelect, previewCropId, previewStage, previewHasWeed = false }: { plot: GameStatePlot; selected: boolean; onSelect: () => void; previewCropId?: CropId; previewStage?: PreviewStage; previewHasWeed?: boolean }) {
  const crop = GARDEN_CROPS.find((item) => item.id === (previewCropId ?? plot.cropId));
  const occupied = Boolean(previewStage) || plot.status !== "EMPTY";
  const growthRatio = !previewStage && plot.status === "GROWING" && plot.cropId !== null && plot.plantedAt !== null
    ? (Date.now() - plot.plantedAt) / CROP_MASTERS[plot.cropId].growDurationMs
    : 1;
  const stage = previewStage?.toLowerCase() ?? (
    plot.status === "READY" ? "ready" :
    plot.status === "GROWING" && growthRatio < SEEDED_STAGE_RATIO ? "seeded" :
    plot.status === "GROWING" && growthRatio < SPROUT_STAGE_RATIO ? "sprout" :
    "growing"
  );
  const atlasY = stage === "ready" ? "100%" : stage === "sprout" ? "33.333%" : "66.667%";
  const offsetY = crop ? (stage === "ready" ? crop.readyY : stage === "sprout" ? crop.sproutY : crop.growY) : "0%";
  const weedPosition = (plot.rowIndex * 4 + plot.slotIndex) % 3;
  return (
    <button type="button" onClick={onSelect} data-garden-row={plot.rowIndex} data-garden-slot={plot.slotIndex} aria-label={`${plot.rowIndex + 1}번 라인 ${plot.slotIndex + 1}번째 칸`} className={`garden-slot ${occupied ? "garden-slot--occupied" : ""} ${selected ? "garden-slot--selected" : ""}`}>
      {stage === "seeded" && <span className="garden-planted-seed" />}
      {crop && stage !== "seeded" && (previewStage || plot.status !== "EMPTY") && <span className={`garden-atlas-sprite garden-atlas-sprite--${stage} garden-atlas-sprite--${crop.id.toLowerCase()}`} style={gardenSpriteStyle(crop.atlasX, atlasY, crop.offsetX, offsetY)} />}
      {stage === "ready" && <span className="garden-sparkle">✦</span>}
      {(plot.hasWeed || previewHasWeed) && <><span className={`garden-weed garden-weed--position-${weedPosition}`} /><span className="garden-alert">!</span></>}
    </button>
  );
}
