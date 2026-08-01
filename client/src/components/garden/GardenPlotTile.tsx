// 정원 밭 한 칸. 상태별 라벨 표시, 선택 시 테두리 강조
import type { GardenPlot, PlotStatus } from "@shared/types/garden";

const STATUS_LABEL: Record<PlotStatus, string> = {
  EMPTY: "빈 밭",
  GROWING: "성장 중",
  READY: "수확 가능",
};

interface GardenPlotTileProps {
  plot: GardenPlot;
  selected: boolean;
  onSelect: () => void;
}

export default function GardenPlotTile({ plot, selected, onSelect }: GardenPlotTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-card transition ${
        selected ? "border-brown" : "border-transparent"
      }`}
    >
      <span className="text-sm text-brown/70">{STATUS_LABEL[plot.status]}</span>
      {plot.hasWeed && <span className="text-xs text-danger">잡초 있음</span>}
    </button>
  );
}
