// 목업 게임 상태. 재화 + 보유 아이템 + 미션 진행도 + 정원. 이후 단계(케이지)에서 필드 확장
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { ItemId } from "@shared/types/cage";
import { ITEM_MASTERS, STARTER_ITEM_IDS } from "@shared/types/cage";
import type { MissionId, MissionProgressState } from "@shared/types/mission";
import { MISSIONS } from "@shared/types/mission";
import type { GardenPlot } from "@shared/types/garden";
import { GARDEN_PLOT_COUNT, HARVEST_REWARD } from "@shared/types/garden";

const STORAGE_KEY = "siniham-mock-game-state";
const STARTER_CURRENCY = 100;

// 실제 lazy-tick(경과 시간 기반 성장)이 없어 데모용으로 짧게 잡은 목업 성장 시간.
// 10단계(실제 API 연결)에서 product-plan.md의 실제 값으로 교체.
export const MOCK_GROW_DURATION_MS = 10_000;

// 아직 케이지/정원 화면이 없어 실제 행동으로 진행도가 안 쌓인다.
// 미션 카드의 상태(진행중/완료대기/수령완료)를 전부 보여주기 위한 임시 시연용 초기값.
const DEMO_MISSION_PROGRESS: Record<MissionId, MissionProgressState> = {
  FEED: { progress: 2, claimed: false },
  WATER: { progress: 1, claimed: false },
  PET: { progress: 0, claimed: false },
  GARDEN: { progress: 1, claimed: true },
};

// 정원 4구획 상태(빈밭/성장중/수확가능/잡초있음)를 한 화면에서 다 보여주기 위한 시연용 초기값.
const DEMO_GARDEN_PLOTS: GardenPlot[] = [
  { id: 0, status: "EMPTY", hasWeed: false, plantedAt: null },
  { id: 1, status: "GROWING", hasWeed: false, plantedAt: Date.now() },
  { id: 2, status: "READY", hasWeed: false, plantedAt: Date.now() - MOCK_GROW_DURATION_MS },
  { id: 3, status: "GROWING", hasWeed: true, plantedAt: Date.now() },
];

interface GameState {
  currency: number;
  ownedItemIds: ItemId[];
  missionProgress: Record<MissionId, MissionProgressState>;
  gardenPlots: GardenPlot[];
  seedCount: number;
}

interface GameStateContextValue extends GameState {
  spendCurrency: (amount: number) => boolean;
  addCurrency: (amount: number) => void;
  purchaseItem: (itemId: ItemId) => boolean;
  claimMissionReward: (missionId: MissionId) => boolean;
  plantSeed: (plotId: number) => boolean;
  removeWeed: (plotId: number) => boolean;
  harvestPlot: (plotId: number) => boolean;
  tickGardenGrowth: () => void;
  resetGameState: () => void;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

function defaultState(): GameState {
  return {
    currency: STARTER_CURRENCY,
    ownedItemIds: [...STARTER_ITEM_IDS],
    missionProgress: DEMO_MISSION_PROGRESS,
    gardenPlots: DEMO_GARDEN_PLOTS,
    seedCount: 1,
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

  function updatePlot(plotId: number, update: Partial<GardenPlot>) {
    persist({
      ...state,
      gardenPlots: state.gardenPlots.map((plot) =>
        plot.id === plotId ? { ...plot, ...update } : plot,
      ),
    });
  }

  function plantSeed(plotId: number): boolean {
    const plot = state.gardenPlots.find((p) => p.id === plotId);
    if (!plot || plot.status !== "EMPTY" || state.seedCount < 1) return false;
    persist({
      ...state,
      seedCount: state.seedCount - 1,
      gardenPlots: state.gardenPlots.map((p) =>
        p.id === plotId ? { ...p, status: "GROWING", plantedAt: Date.now(), hasWeed: false } : p,
      ),
    });
    return true;
  }

  function removeWeed(plotId: number): boolean {
    const plot = state.gardenPlots.find((p) => p.id === plotId);
    if (!plot || !plot.hasWeed) return false;
    persist({ ...state, seedCount: state.seedCount + 1 });
    updatePlot(plotId, { hasWeed: false });
    return true;
  }

  function harvestPlot(plotId: number): boolean {
    const plot = state.gardenPlots.find((p) => p.id === plotId);
    if (!plot || plot.status !== "READY") return false;
    persist({
      ...state,
      currency: state.currency + HARVEST_REWARD,
      gardenPlots: state.gardenPlots.map((p) =>
        p.id === plotId ? { id: p.id, status: "EMPTY", hasWeed: false, plantedAt: null } : p,
      ),
    });
    return true;
  }

  function tickGardenGrowth() {
    const now = Date.now();
    let changed = false;
    const nextPlots = state.gardenPlots.map((plot) => {
      if (plot.status === "GROWING" && plot.plantedAt && now - plot.plantedAt >= MOCK_GROW_DURATION_MS) {
        changed = true;
        return { ...plot, status: "READY" as const };
      }
      return plot;
    });
    if (changed) {
      persist({ ...state, gardenPlots: nextPlots });
    }
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
        plantSeed,
        removeWeed,
        harvestPlot,
        tickGardenGrowth,
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
