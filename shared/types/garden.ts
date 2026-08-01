// 정원 구획 타입 (docs/specs/screen-design.md 6.7 기준)

export type PlotStatus = "EMPTY" | "GROWING" | "READY";

export interface GardenPlot {
  id: number;
  status: PlotStatus;
  hasWeed: boolean;
  plantedAt: number | null;
}

export const GARDEN_PLOT_COUNT = 4;
export const HARVEST_REWARD = 5;
