// 로그인되면 localStorage 목업 상태를 불러오고, 각 액션 결과로 최신 상태를 교체한다.
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ItemId } from "@shared/types/cage";
import type { MissionId } from "@shared/types/mission";
import type { HamsterBehavior } from "@shared/types/hamster";
import type { CreateHamsterRequest, HamsterAction, IdleActivityItemId } from "@shared/types/hamster";
import type { GameStateResponse } from "@shared/types/gameState";
import * as gameApi from "../lib/gameApi";
import { useAuth } from "./AuthContext";

interface GameStateContextValue {
  state: GameStateResponse | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  purchaseItem: (itemId: ItemId) => Promise<void>;
  plantSeed: (plotId: number) => Promise<void>;
  removeWeed: (plotId: number) => Promise<void>;
  harvestPlot: (plotId: number) => Promise<void>;
  ackGardenSummary: () => Promise<void>;
  claimMissionReward: (missionId: MissionId) => Promise<void>;
  discoverBehavior: (behaviorId: HamsterBehavior) => Promise<void>;
  createHamster: (input: CreateHamsterRequest) => Promise<void>;
  performHamsterAction: (action: HamsterAction) => Promise<void>;
  performIdleActivity: (itemId: IdleActivityItemId) => Promise<void>;
  moveCageItem: (
    itemId: string,
    posX: number,
    posY: number,
    scale?: number,
    flipped?: boolean,
  ) => Promise<void>;
  storeCageItem: (itemId: string) => Promise<void>;
  placeCageItem: (itemMasterId: ItemId) => Promise<void>;
  resizeHamster: (scale: number) => Promise<void>;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const { nickname } = useAuth();
  const [state, setState] = useState<GameStateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function refresh() {
    setState(await gameApi.fetchState());
  }

  useEffect(() => {
    if (!nickname) {
      setState(null);
      return;
    }
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname]);

  async function purchaseItem(itemId: ItemId) {
    setState(await gameApi.purchaseItem(itemId));
  }

  async function plantSeed(plotId: number) {
    setState(await gameApi.plantSeed(plotId));
  }

  async function removeWeed(plotId: number) {
    setState(await gameApi.removeWeed(plotId));
  }

  async function harvestPlot(plotId: number) {
    setState(await gameApi.harvestPlot(plotId));
  }

  async function ackGardenSummary() {
    setState(await gameApi.ackGardenSummary());
  }

  async function claimMissionReward(missionId: MissionId) {
    setState(await gameApi.claimMissionReward(missionId));
  }

  async function discoverBehavior(behaviorId: HamsterBehavior) {
    setState(await gameApi.discoverBehavior(behaviorId));
  }

  async function createHamster(input: CreateHamsterRequest) {
    setState(await gameApi.createHamster(input));
  }

  async function performHamsterAction(action: HamsterAction) {
    setState(await gameApi.performHamsterAction(action));
  }

  async function performIdleActivity(itemId: IdleActivityItemId) {
    setState(await gameApi.performIdleActivity(itemId));
  }

  async function moveCageItem(
    itemId: string,
    posX: number,
    posY: number,
    scale?: number,
    flipped?: boolean,
  ) {
    setState(await gameApi.moveCageItem(itemId, posX, posY, scale, flipped));
  }

  async function storeCageItem(itemId: string) {
    setState(await gameApi.storeCageItem(itemId));
  }

  async function placeCageItem(itemMasterId: ItemId) {
    setState(await gameApi.placeCageItem(itemMasterId));
  }

  async function resizeHamster(scale: number) {
    setState(await gameApi.resizeHamster(scale));
  }

  return (
    <GameStateContext.Provider
      value={{
        state,
        isLoading,
        refresh,
        purchaseItem,
        plantSeed,
        removeWeed,
        harvestPlot,
        ackGardenSummary,
        claimMissionReward,
        discoverBehavior,
        createHamster,
        performHamsterAction,
        performIdleActivity,
        moveCageItem,
        storeCageItem,
        placeCageItem,
        resizeHamster,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

function useGameStateContext() {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error("useGameState는 GameStateProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}

// GameShell처럼 로딩 상태 자체를 다뤄야 하는 곳에서 사용
export function useGameStateStatus() {
  const ctx = useGameStateContext();
  return { isLoading: ctx.isLoading, isReady: ctx.state !== null, refresh: ctx.refresh };
}

// 상태가 이미 로드되어 있다고 가정하는 화면(GameShell 하위)에서 사용
export function useGameState() {
  const ctx = useGameStateContext();
  if (!ctx.state) {
    throw new Error("게임 상태가 아직 로드되지 않았습니다. GameShell 하위에서만 사용하세요.");
  }
  return {
    ...ctx.state,
    purchaseItem: ctx.purchaseItem,
    plantSeed: ctx.plantSeed,
    removeWeed: ctx.removeWeed,
    harvestPlot: ctx.harvestPlot,
    ackGardenSummary: ctx.ackGardenSummary,
    claimMissionReward: ctx.claimMissionReward,
    discoverBehavior: ctx.discoverBehavior,
    createHamster: ctx.createHamster,
    performHamsterAction: ctx.performHamsterAction,
    performIdleActivity: ctx.performIdleActivity,
    moveCageItem: ctx.moveCageItem,
    storeCageItem: ctx.storeCageItem,
    placeCageItem: ctx.placeCageItem,
    resizeHamster: ctx.resizeHamster,
    refresh: ctx.refresh,
  };
}
