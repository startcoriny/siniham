// 햄스터를 돌보고 가구를 배치하는 메인 케이지 화면.
import { useState } from "react";
import type { MouseEvent } from "react";
import type { HamsterAction, HamsterBehavior } from "@shared/types/hamster";
import { ITEM_MASTERS } from "@shared/types/cage";
import HamsterSprite from "../components/hamster/HamsterSprite";
import Modal from "../components/common/Modal";
import PixelButton from "../components/common/PixelButton";
import StatusBar from "../components/common/StatusBar";
import { useToast } from "../components/common/Toast";
import { useGameState } from "../context/GameStateContext";

const ACTIONS: Array<{ id: HamsterAction; label: string; behavior: HamsterBehavior }> = [
  { id: "FEED", label: "밥 주기", behavior: "EAT" },
  { id: "WATER", label: "물 주기", behavior: "DRINK" },
  { id: "PET", label: "쓰다듬기", behavior: "PET" },
  { id: "CLEAN", label: "청소하기", behavior: "WASH" },
];

const ITEM_ICON = { FOOD_BOWL: "🥣", WATER_BOTTLE: "💧", HOUSE: "🏠", WHEEL: "🎡", TUNNEL: "🪵" };

export default function CagePage() {
  const { hamster, cageItems, performHamsterAction, moveCageItem } = useGameState();
  const { showToast } = useToast();
  const [behavior, setBehavior] = useState<HamsterBehavior>("IDLE");
  const [hamsterPosition, setHamsterPosition] = useState({ x: 0.5, y: 0.68 });
  const [busy, setBusy] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  if (!hamster) return null;

  async function act(action: HamsterAction, nextBehavior: HamsterBehavior) {
    setBusy(true);
    const targetItem = cageItems.find((item) =>
      action === "FEED" ? item.itemId === "FOOD_BOWL"
      : action === "WATER" ? item.itemId === "WATER_BOTTLE"
      : false,
    );
    if (targetItem) {
      setBehavior("WALK");
      setHamsterPosition({ x: targetItem.posX, y: Math.min(0.82, targetItem.posY + 0.12) });
      await new Promise((resolve) => window.setTimeout(resolve, 900));
    }
    setBehavior(nextBehavior);
    try {
      await performHamsterAction(action);
      showToast(`${hamster!.name}에게 잘 전해졌어요.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "행동을 완료하지 못했어요.");
    } finally {
      window.setTimeout(() => {
        setBehavior("IDLE");
        setHamsterPosition({ x: 0.5, y: 0.68 });
      }, 900);
      setBusy(false);
    }
  }

  async function placeItem(event: MouseEvent<HTMLDivElement>) {
    if (!editing || !selectedItemId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const posX = Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width));
    const posY = Math.max(0.15, Math.min(0.85, (event.clientY - rect.top) / rect.height));
    try {
      await moveCageItem(selectedItemId, posX, posY);
      setSelectedItemId(null);
      showToast("가구 위치를 저장했어요.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "가구를 옮기지 못했어요.");
    }
  }

  const stats = hamster.stats;
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-3 md:p-6">
      <section className="grid gap-4 rounded-2xl bg-card p-4 shadow-sm md:grid-cols-[240px_1fr]">
        <div className="space-y-2">
          <button type="button" onClick={() => setDetailOpen(true)} className="mb-2 text-left">
            <strong className="text-xl">{hamster.name}</strong>
            <span className="ml-2 text-sm text-brown/60">자세히 보기</span>
          </button>
          <StatusBar label="배고픔" value={stats.hunger} />
          <StatusBar label="목마름" value={stats.thirst} />
          <StatusBar label="청결" value={stats.cleanliness} />
          <StatusBar label="기분" value={stats.mood} />
        </div>

        <div
          onClick={placeItem}
          className={`relative aspect-[10/7] min-h-72 overflow-hidden rounded-2xl border-4 border-brown/20 bg-[linear-gradient(#d9f0c4_0_58%,#e7c58c_58%)] ${editing ? "cursor-crosshair" : ""}`}
        >
          {cageItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={(event) => {
                event.stopPropagation();
                if (editing) setSelectedItemId(item.id);
              }}
              title={ITEM_MASTERS[item.itemId].name}
              className={`absolute -translate-x-1/2 -translate-y-1/2 text-4xl drop-shadow md:text-6xl ${selectedItemId === item.id ? "rounded-xl ring-4 ring-accent-pink" : ""}`}
              style={{ left: `${item.posX * 100}%`, top: `${item.posY * 100}%` }}
            >
              {ITEM_ICON[item.itemId]}
            </button>
          ))}
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); if (!editing) setDetailOpen(true); }}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-[850ms]"
            style={{ left: `${hamsterPosition.x * 100}%`, top: `${hamsterPosition.y * 100}%` }}
          >
            <HamsterSprite appearance={hamster.appearance} behavior={behavior} size={160} />
          </button>
          {editing && (
            <p className="absolute inset-x-3 top-3 rounded-lg bg-card/90 p-2 text-center text-sm">
              {selectedItemId ? "새 위치를 눌러 주세요." : "옮길 가구를 선택해 주세요."}
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {ACTIONS.map((action) => (
          <PixelButton key={action.id} disabled={busy || editing} onClick={() => act(action.id, action.behavior)}>
            {action.label}
          </PixelButton>
        ))}
        <PixelButton variant="secondary" onClick={() => { setEditing(!editing); setSelectedItemId(null); }}>
          {editing ? "꾸미기 완료" : "꾸미기"}
        </PixelButton>
      </div>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`${hamster.name} 정보`}>
        <div className="space-y-2 text-sm">
          <p>성격. {hamster.personality}</p>
          <p>성장 단계. {hamster.growthStage === "BABY" ? "아기" : hamster.growthStage}</p>
          <StatusBar label="체력" value={stats.stamina} />
          <StatusBar label="친밀도" value={stats.intimacy} />
          <PixelButton className="mt-4 w-full" onClick={() => setDetailOpen(false)}>닫기</PixelButton>
        </div>
      </Modal>
    </div>
  );
}
