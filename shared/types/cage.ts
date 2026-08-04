// 케이지 아이템(가구) 타입. MVP 5종 (docs/product-plan.md 6, 7장 기준)

export type ItemId =
  | "FOOD_BOWL"
  | "WATER_BOTTLE"
  | "HANDHELD_WATER_BOTTLE"
  | "WATER_BOWL"
  | "HOUSE"
  | "WHEEL"
  | "SAND_BATH"
  | "SNACK_DISH"
  | "LOOKOUT";

export interface ItemMasterInfo {
  id: ItemId;
  name: string;
  cost: number;
  purchasable: boolean;
  description: string;
}

export const ITEM_MASTERS: Record<ItemId, ItemMasterInfo> = {
  FOOD_BOWL: {
    id: "FOOD_BOWL",
    name: "먹이통",
    cost: 0,
    purchasable: false,
    description: "기본으로 제공되는 먹이통이에요.",
  },
  WATER_BOTTLE: {
    id: "WATER_BOTTLE",
    name: "물통",
    cost: 0,
    purchasable: false,
    description: "기본으로 제공되는 물통이에요.",
  },
  HANDHELD_WATER_BOTTLE: {
    id: "HANDHELD_WATER_BOTTLE",
    name: "손에 쥐는 물병",
    cost: 50,
    purchasable: false,
    description: "햄스터가 두 손으로 잡고 마시는 작은 물병이에요. 준비 중이에요.",
  },
  WATER_BOWL: {
    id: "WATER_BOWL",
    name: "물그릇",
    cost: 30,
    purchasable: false,
    description: "편하게 고개를 숙여 마실 수 있는 낮은 물그릇이에요. 준비 중이에요.",
  },
  HOUSE: {
    id: "HOUSE",
    name: "집",
    cost: 0,
    purchasable: false,
    description: "기본으로 제공되는 집이에요.",
  },
  WHEEL: {
    id: "WHEEL",
    name: "쳇바퀴",
    cost: 0,
    purchasable: true,
    description: "햄스터가 신나게 달릴 수 있어요. 기분은 올라가지만 체력을 사용해요.",
  },
  SAND_BATH: {
    id: "SAND_BATH",
    name: "모래목욕통",
    cost: 0,
    purchasable: true,
    description: "모래에 뒹굴며 스스로 몸을 씻어요. 청결이 조금씩 회복돼요.",
  },
  SNACK_DISH: {
    id: "SNACK_DISH",
    name: "해바라기씨 접시",
    cost: 120,
    purchasable: false,
    description: "가끔 씨앗을 볼에 가득 채워요. 기분이 좋아져요. 준비 중이에요.",
  },
  LOOKOUT: {
    id: "LOOKOUT",
    name: "전망대",
    cost: 120,
    purchasable: false,
    description: "높은 곳에 올라가 케이지를 둘러봐요. 기분이 좋아져요. 준비 중이에요.",
  },
};

export const STARTER_ITEM_IDS: ItemId[] = ["FOOD_BOWL", "WATER_BOTTLE", "HOUSE"];

export const DISPLAY_SCALE_MIN = 0.7;
export const DISPLAY_SCALE_MAX = 1.4;
export const DISPLAY_SCALE_STEP = 0.05;
export const DEFAULT_DISPLAY_SCALE = 1;

// 케이지에 배치된 아이템 인스턴스. 위치는 케이지 스테이지 비율 좌표(4단계에서 사용)
export interface CageItem {
  id: string;
  itemId: ItemId;
  posX: number;
  posY: number;
  scale: number;
  flipped: boolean;
}
