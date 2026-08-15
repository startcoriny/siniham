// 상점/정원/미션/도감 API 호출. 전부 최신 GameStateResponse를 반환한다.
import type { ItemId } from "@shared/types/cage";
import type { MissionId } from "@shared/types/mission";
import type { CropId } from "@shared/types/garden";
import type {
  CreateHamsterRequest,
  HamsterAction,
  HamsterBehavior,
  IdleActivityItemId,
} from "@shared/types/hamster";
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

export function purchaseSeed(cropId: CropId, quantity = 1): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>("/garden/seeds/purchase", {
    method: "POST",
    body: JSON.stringify({ cropId, quantity }),
  });
}

export function plantSeed(plotId: number, cropId: CropId): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/garden/${plotId}/plant`, {
    method: "POST",
    body: JSON.stringify({ cropId }),
  });
}

export function clearGardenPlot(plotId: number): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/garden/${plotId}`, { method: "DELETE" });
}

export function removeWeed(plotId: number): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/garden/${plotId}/remove-weed`, { method: "POST" });
}

export function fillGardenWithTestWeeds(): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>("/garden/weeds/test-fill", { method: "POST" });
}

export function harvestPlot(plotId: number): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/garden/${plotId}/harvest`, { method: "POST" });
}

export function eatProduce(cropId: CropId): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>("/garden/produce/eat", {
    method: "POST",
    body: JSON.stringify({ cropId }),
  });
}

// "정원 소식"을 확인 처리한다. 서버에 쌓인 요약이 비워져 다음 응답부터 gardenSummary가 null이 된다.
export function ackGardenSummary(): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>("/garden/summary/ack", { method: "POST" });
}

export function claimMissionReward(missionId: MissionId): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/missions/${missionId}/claim`, { method: "POST" });
}

export function discoverBehavior(behaviorId: HamsterBehavior): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/behaviors/${behaviorId}/discover`, { method: "POST" });
}

export function createHamster(input: CreateHamsterRequest): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>("/hamster", { method: "POST", body: JSON.stringify(input) });
}

export function performHamsterAction(action: HamsterAction): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>("/hamster/action", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

// 햄스터가 가구를 스스로 쓴 뒤 호출한다. 서버가 쿨다운을 보고 효과 반영 여부를 정한다.
export function performIdleActivity(itemId: IdleActivityItemId): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>("/hamster/idle-activity", {
    method: "POST",
    body: JSON.stringify({ itemId }),
  });
}

export function moveCageItem(
  itemId: string,
  posX: number,
  posY: number,
  scale?: number,
  flipped?: boolean,
): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/hamster/cage-items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ posX, posY, scale, flipped }),
  });
}

export function storeCageItem(itemId: string): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/hamster/cage-items/${itemId}/store`, { method: "PATCH" });
}

export function placeCageItem(itemMasterId: ItemId): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>(`/hamster/cage-items/${itemMasterId}/place`, { method: "POST" });
}

export function resizeHamster(scale: number): Promise<GameStateResponse> {
  return apiRequest<GameStateResponse>("/hamster/display-scale", {
    method: "PATCH",
    body: JSON.stringify({ scale }),
  });
}
