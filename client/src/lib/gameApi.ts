// 상점/정원/미션/도감 API 호출. 전부 최신 GameStateResponse를 반환한다.
import type { ItemId } from "@shared/types/cage";
import type { MissionId } from "@shared/types/mission";
import type { HamsterBehavior } from "@shared/types/hamster";
import type { GameStateResponse } from "@shared/types/gameState";
import { apiRequest } from "./http";

export function fetchState(): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>("/state");
}

export function purchaseItem(itemId: ItemId): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>("/shop/purchase", {
    method: "POST",
    body: JSON.stringify({ itemId }),
  });
}

export function plantSeed(plotId: number): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/garden/${plotId}/plant`, { method: "POST" });
}

export function removeWeed(plotId: number): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/garden/${plotId}/remove-weed`, { method: "POST" });
}

export function harvestPlot(plotId: number): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/garden/${plotId}/harvest`, { method: "POST" });
}

export function claimMissionReward(missionId: MissionId): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/missions/${missionId}/claim`, { method: "POST" });
}

export function discoverBehavior(behaviorId: HamsterBehavior): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/behaviors/${behaviorId}/discover`, { method: "POST" });
}
