// 햄스터 외형/행동/팔레트 타입 (docs/references/hamster-character-info.md 4, 5, 7, 12장 기준)

export type HamsterAppearance =
  | "GOLDEN"
  | "GRAY"
  | "WHITE"
  | "BEIGE"
  | "BROWN"
  | "CHARCOAL"
  | "CREAM";

export interface HamsterAppearanceInfo {
  id: HamsterAppearance;
  name: string;
  folder: string;
}

export const HAMSTER_APPEARANCES: Record<HamsterAppearance, HamsterAppearanceInfo> = {
  GOLDEN: { id: "GOLDEN", name: "골든", folder: "golden" },
  GRAY: { id: "GRAY", name: "그레이", folder: "gray" },
  WHITE: { id: "WHITE", name: "화이트", folder: "white" },
  BEIGE: { id: "BEIGE", name: "베이지", folder: "beige" },
  BROWN: { id: "BROWN", name: "브라운", folder: "brown" },
  CHARCOAL: { id: "CHARCOAL", name: "차콜", folder: "charcoal" },
  CREAM: { id: "CREAM", name: "크림", folder: "cream" },
};

export const DEFAULT_HAMSTER_APPEARANCE: HamsterAppearance = "GOLDEN";

export type HamsterBehavior =
  | "IDLE"
  | "WALK"
  | "LOOK"
  | "EAT"
  | "DRINK"
  | "SLEEP"
  | "WHEEL"
  | "PET"
  | "WASH"
  | "CHEEK"
  | "USER_LOOK"
  | "GARDEN";

// 파일명 규칙(10장). user-look만 케밥 케이스
export const HAMSTER_BEHAVIOR_FILE_NAME: Record<HamsterBehavior, string> = {
  IDLE: "idle",
  WALK: "walk",
  LOOK: "look",
  EAT: "eat",
  DRINK: "drink",
  SLEEP: "sleep",
  WHEEL: "wheel",
  PET: "pet",
  WASH: "wash",
  CHEEK: "cheek",
  USER_LOOK: "user-look",
  GARDEN: "garden",
};

export interface HamsterStats {
  hunger: number;
  thirst: number;
  cleanliness: number;
  mood: number;
  stamina: number;
  intimacy: number;
}

export interface Hamster {
  id: string;
  name: string;
  appearance: HamsterAppearance;
  stats: HamsterStats;
  personality: string;
  growthStage: string;
  createdAt: string;
  state: "IDLE" | "SLEEPING";
}

export type HamsterAction = "FEED" | "WATER" | "PET" | "CLEAN";

export interface CreateHamsterRequest {
  name: string;
  appearance: Extract<HamsterAppearance, "GOLDEN" | "GRAY">;
}
