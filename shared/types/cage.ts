// 케이지 아이템(가구) 타입. MVP 5종 (docs/product-plan.md 6, 7장 기준)

export type ItemId = "FOOD_BOWL" | "WATER_BOTTLE" | "HOUSE" | "WHEEL" | "TUNNEL";

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
    cost: 100,
    purchasable: true,
    description: "햄스터가 신나게 달릴 수 있어요. 기분은 올라가지만 체력을 사용해요.",
  },
  TUNNEL: {
    id: "TUNNEL",
    name: "터널",
    cost: 150,
    purchasable: true,
    description: "햄스터가 안으로 들어가 놀 수 있어요.",
  },
};

export const STARTER_ITEM_IDS: ItemId[] = ["FOOD_BOWL", "WATER_BOTTLE", "HOUSE"];

// 케이지에 배치된 아이템 인스턴스. 위치는 케이지 스테이지 비율 좌표(4단계에서 사용)
export interface CageItem {
  id: string;
  itemId: ItemId;
  posX: number;
  posY: number;
}
