// 목업 게임 상태. 지금은 재화만. 이후 단계(상점/케이지/정원)에서 필드 확장
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "siniham-mock-game-state";
const STARTER_CURRENCY = 100;

interface GameState {
  currency: number;
}

interface GameStateContextValue extends GameState {
  spendCurrency: (amount: number) => boolean;
  addCurrency: (amount: number) => void;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

function loadState(): GameState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { currency: STARTER_CURRENCY };
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return { currency: STARTER_CURRENCY };
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

  return (
    <GameStateContext.Provider value={{ ...state, spendCurrency, addCurrency }}>
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
