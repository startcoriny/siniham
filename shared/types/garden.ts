// 정원의 작물, 씨앗, 수확물과 재배 슬롯 규칙.
export type PlotStatus = "EMPTY" | "GROWING" | "READY";
export type CropId = "CARROT" | "STRAWBERRY" | "TOMATO" | "SUNFLOWER";

export interface CropMasterInfo {
  id: CropId;
  name: string;
  seedCost: number;
  growDurationMs: number;
  yield: number;
  hungerEffect: number;
  moodEffect: number;
}

export const CROP_MASTERS: Record<CropId, CropMasterInfo> = {
  CARROT: { id: "CARROT", name: "당근", seedCost: 4, growDurationMs: 30 * 60_000, yield: 2, hungerEffect: 10, moodEffect: 0 },
  STRAWBERRY: { id: "STRAWBERRY", name: "딸기", seedCost: 10, growDurationMs: 2 * 60 * 60_000, yield: 3, hungerEffect: 8, moodEffect: 2 },
  TOMATO: { id: "TOMATO", name: "토마토", seedCost: 18, growDurationMs: 4 * 60 * 60_000, yield: 4, hungerEffect: 12, moodEffect: 0 },
  SUNFLOWER: { id: "SUNFLOWER", name: "해바라기", seedCost: 28, growDurationMs: 8 * 60 * 60_000, yield: 5, hungerEffect: 6, moodEffect: 4 },
};

export const CROP_IDS = Object.keys(CROP_MASTERS) as CropId[];
export const GARDEN_ROW_COUNT = 4;
export const GARDEN_SLOTS_PER_ROW = 4;
export const GARDEN_PLOT_COUNT = GARDEN_ROW_COUNT * GARDEN_SLOTS_PER_ROW;
export const WEED_GROWTH_PENALTY = 0.2;
export const HARVEST_REWARD = 0;

export interface GardenPlot {
  id: number;
  rowIndex: number;
  slotIndex: number;
  cropId: CropId | null;
  status: PlotStatus;
  hasWeed: boolean;
  plantedAt: number | null;
}
