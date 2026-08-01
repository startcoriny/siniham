// 목업 게임 상태. 재화 + 보유 아이템 + 미션 진행도. 이후 단계(케이지/정원)에서 필드 확장
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { ItemId } from "@shared/types/cage";
import { ITEM_MASTERS, STARTER_ITEM_IDS } from "@shared/types/cage";
import type { MissionId, MissionProgressState } from "@shared/types/mission";
import { MISSIONS } from "@shared/types/mission";

const STORAGE_KEY = "siniham-mock-game-state";
const STARTER_CURRENCY = 100;

// 아직 케이지/정원 화면이 없어 실제 행동으로 진행도가 안 쌓인다.
// 미션 카드의 상태(진행중/완료대기/수령완료)를 전부 보여주기 위한 임시 시연용 초기값.
const DEMO_MISSION_PROGRESS: Record<MissionId, MissionProgressState> = {
  FEED: { progress: 2, claimed: false },
  WATER: { progress: 1, claimed: false },
  PET: { progress: 0, claimed: false },
  GARDEN: { progress: 1, claimed: true },
};

interface GameState {
  currency: number;
  ownedItemIds: ItemId[];
  missionProgress: Record<MissionId, MissionProgressState>;
}

interface GameStateContextValue extends GameState {
  spendCurrency: (amount: number) => boolean;
  addCurrency: (amount: number) => void;
  purchaseItem: (itemId: ItemId) => boolean;
  claimMissionReward: (missionId: MissionId) => boolean;
  resetGameState: () => void;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

function defaultState(): GameState {
  return {
    currency: STARTER_CURRENCY,
    ownedItemIds: [...STARTER_ITEM_IDS],
    missionProgress: DEMO_MISSION_PROGRESS,
  };
}

function loadState(): GameState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return defaultState();
  }
}

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);

  function persist(next: GameState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState(next);
  }

  function spendCurrency(amount: number): boolean {
    if (state.currency < amount) return false;
    persist({ ...state, currency: state.currency - amount });
    return true;
  }

  function addCurrency(amount: number) {
    persist({ ...state, currency: state.currency + amount });
  }

  function purchaseItem(itemId: ItemId): boolean {
    if (state.ownedItemIds.includes(itemId)) return false;
    const cost = ITEM_MASTERS[itemId].cost;
    if (state.currency < cost) return false;
    persist({
      ...state,
      currency: state.currency - cost,
      ownedItemIds: [...state.ownedItemIds, itemId],
    });
    return true;
  }

  function claimMissionReward(missionId: MissionId): boolean {
    const mission = state.missionProgress[missionId];
    const info = MISSIONS[missionId];
    if (mission.claimed || mission.progress < info.target) return false;
    persist({
      ...state,
      currency: state.currency + info.reward,
      missionProgress: {
        ...state.missionProgress,
        [missionId]: { ...mission, claimed: true },
      },
    });
    return true;
  }

  function resetGameState() {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState());
  }

  return (
    <GameStateContext.Provider
      value={{
        ...state,
        spendCurrency,
        addCurrency,
        purchaseItem,
        claimMissionReward,
        resetGameState,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error("useGameState는 GameStateProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}
