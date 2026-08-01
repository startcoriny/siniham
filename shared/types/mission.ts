// 일일 미션 타입 (docs/product-plan.md 7장 경제/미션 밸런스 기준)

export type MissionId = "FEED" | "WATER" | "PET" | "GARDEN";

export interface MissionInfo {
  id: MissionId;
  name: string;
  target: number;
  reward: number;
}

export const MISSIONS: Record<MissionId, MissionInfo> = {
  FEED: { id: "FEED", name: "밥 챙겨주기", target: 3, reward: 15 },
  WATER: { id: "WATER", name: "물 채우기", target: 1, reward: 10 },
  PET: { id: "PET", name: "애정 표현", target: 3, reward: 15 },
  GARDEN: { id: "GARDEN", name: "정원 돌보기", target: 1, reward: 15 },
};

export interface MissionProgressState {
  progress: number;
  claimed: boolean;
}
