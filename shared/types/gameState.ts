// GET /api/state 및 상점/정원/미션/도감 액션 API가 공통으로 반환하는 상태 (client, server 공용)
import type { ItemId } from "./cage";
import type { PlotStatus } from "./garden";
import type { MissionId } from "./mission";
import type { HamsterBehavior } from "./hamster";
import type { CageItem } from "./cage";
import type { Hamster } from "./hamster";

export interface GameStatePlot {
  id: number;
  status: PlotStatus;
  hasWeed: boolean;
  plantedAt: number | null;
}

// 자리를 비운 사이 정원에 일어난 변화. 확인(ack)하기 전까지 유지되고, 변화가 없으면 null이다.
export interface GardenSummary {
  grownCount: number;
  weedCount: number;
  since: string | null;
}

export interface GameStateResponse {
  currency: number;
  seedCount: number;
  // 한국 자정까지 남은 시간(ms). 응답 시점 기준이라 화면에서 경과분을 빼서 표시한다.
  missionResetInMs: number;
  gardenSummary: GardenSummary | null;
  ownedItemIds: ItemId[];
  gardenPlots: GameStatePlot[];
  missionProgress: Record<MissionId, { progress: number; claimed: boolean }>;
  discoveredBehaviors: Partial<Record<HamsterBehavior, string>>;
  cageItems: CageItem[];
  hamster: Hamster | null;
}
