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

export interface GameStateResponse {
  currency: number;
  seedCount: number;
  ownedItemIds: ItemId[];
  gardenPlots: GameStatePlot[];
  missionProgress: Record<MissionId, { progress: number; claimed: boolean }>;
  discoveredBehaviors: Partial<Record<HamsterBehavior, string>>;
  cageItems: CageItem[];
  hamster: Hamster | null;
}
