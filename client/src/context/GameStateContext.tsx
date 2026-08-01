// 목업 게임 상태. 재화 + 보유 아이템. 이후 단계(케이지/정원)에서 필드 확장
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { ItemId } from "@shared/types/cage";
import { ITEM_MASTERS, STARTER_ITEM_IDS } from "@shared/types/cage";

const STORAGE_KEY = "siniham-mock-game-state";
const STARTER_CURRENCY = 100;

interface GameState {
  currency: number;
  ownedItemIds: ItemId[];
}

interface GameStateContextValue extends GameState {
  spendCurrency: (amount: number) => boolean;
  addCurrency: (amount: number) => void;
  purchaseItem: (itemId: ItemId) => boolean;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

function defaultState(): GameState {
  return { currency: STARTER_CURRENCY, ownedItemIds: [...STARTER_ITEM_IDS] };
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
      currency: state.currency - cost,
      ownedItemIds: [...state.ownedItemIds, itemId],
    });
    return true;
  }

  return (
    <GameStateContext.Provider value={{ ...state, spendCurrency, addCurrency, purchaseItem }}>
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
