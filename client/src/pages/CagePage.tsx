// 햄스터를 돌보고 가구를 배치하는 메인 케이지 화면.
import { useEffect, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type { HamsterAction, HamsterBehavior } from "@shared/types/hamster";
import { ITEM_MASTERS } from "@shared/types/cage";
import HamsterSprite from "../components/hamster/HamsterSprite";
import Modal from "../components/common/Modal";
import PixelButton from "../components/common/PixelButton";
import StatusBar from "../components/common/StatusBar";
import { useToast } from "../components/common/Toast";
import { useGameState } from "../context/GameStateContext";
import foodBowlImage from "../assets/cage-items/food-bowl.png";
import houseImage from "../assets/cage-items/house.png";
import waterBottleImage from "../assets/cage-items/water-bottle.png";
import wheelImage from "../assets/cage-items/wheel.png";
import handheldWaterBottleImage from "../assets/cage-items/handheld-water-bottle.png";
import waterBowlImage from "../assets/cage-items/water-bowl.png";
import wheelSpin1 from "../assets/cage-items/wheel-spin/frame-01.png";
import wheelSpin2 from "../assets/cage-items/wheel-spin/frame-02.png";
import wheelSpin3 from "../assets/cage-items/wheel-spin/frame-03.png";
import wheelSpin4 from "../assets/cage-items/wheel-spin/frame-04.png";

const ACTIONS: Array<{ id: HamsterAction; label: string; behavior: HamsterBehavior }> = [
  { id: "FEED", label: "밥 주기", behavior: "EAT" },
  { id: "WATER", label: "물 주기", behavior: "DRINK" },
  { id: "PET", label: "쓰다듬기", behavior: "PET" },
  { id: "CLEAN", label: "청소하기", behavior: "WASH" },
];

const ITEM_ASSET = {
  FOOD_BOWL: { src: foodBowlImage, width: "w-16 md:w-24" },
  WATER_BOTTLE: { src: waterBottleImage, width: "w-14 md:w-20" },
  HANDHELD_WATER_BOTTLE: { src: handheldWaterBottleImage, width: "w-12 md:w-16" },
  WATER_BOWL: { src: waterBowlImage, width: "w-16 md:w-24" },
  HOUSE: { src: houseImage, width: "w-24 md:w-36" },
  WHEEL: { src: wheelImage, width: "w-28 md:w-44" },
} as const;
const WHEEL_SPIN_FRAMES = [wheelSpin1, wheelSpin2, wheelSpin3, wheelSpin4];

export default function CagePage() {
  const { hamster, cageItems, performHamsterAction, moveCageItem } = useGameState();
  const { showToast } = useToast();
  const [behavior, setBehavior] = useState<HamsterBehavior>("IDLE");
  const [hamsterPosition, setHamsterPosition] = useState({ x: 0.5, y: 0.68 });
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [busy, setBusy] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);
  const [isInHouse, setIsInHouse] = useState(false);
  const [houseActivityPosition, setHouseActivityPosition] = useState<{ x: number; y: number } | null>(null);
  const [wheelFrameIndex, setWheelFrameIndex] = useState(0);

  useEffect(() => {
    if (!activeWheelId) {
      setWheelFrameIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setWheelFrameIndex((current) => (current + 1) % WHEEL_SPIN_FRAMES.length);
    }, 160);
    return () => window.clearInterval(timer);
  }, [activeWheelId]);

  useEffect(() => {
    if (busy || editing || detailOpen) return;
    const timers: number[] = [];

    function later(callback: () => void, delay: number) {
      const timer = window.setTimeout(callback, delay);
      timers.push(timer);
    }

    function walkTo(target: { x: number; y: number }, onArrive: () => void) {
      setHamsterPosition((current) => {
        setFacing(target.x < current.x ? "left" : "right");
        return target;
      });
      setBehavior("WALK");
      later(onArrive, 1100);
    }

    function scheduleWalk() {
      later(() => {
        const wheel = cageItems.find((item) => item.itemId === "WHEEL");
        const house = cageItems.find((item) => item.itemId === "HOUSE");
        const activityRoll = Math.random();

        if (wheel && activityRoll < 0.2) {
          walkTo({ x: wheel.posX, y: Math.min(0.8, wheel.posY + 0.04) }, () => {
            setActiveWheelId(wheel.id);
            setBehavior("WALK");
            later(() => {
              setActiveWheelId(null);
              setBehavior("IDLE");
              scheduleWalk();
            }, 2600);
          });
          return;
        }

        if (house && activityRoll < 0.4) {
          walkTo({ x: house.posX, y: Math.min(0.82, house.posY + 0.08) }, () => {
            setHouseActivityPosition({ x: house.posX, y: house.posY });
            setIsInHouse(true);
            setBehavior("SLEEP");
            later(() => {
              setIsInHouse(false);
              setHouseActivityPosition(null);
              setBehavior("IDLE");
              setHamsterPosition({ x: Math.min(0.84, house.posX + 0.15), y: Math.min(0.82, house.posY + 0.12) });
              scheduleWalk();
            }, 3000);
          });
          return;
        }

        const target = { x: 0.18 + Math.random() * 0.64, y: 0.5 + Math.random() * 0.28 };
        walkTo(target, () => {
          setBehavior("IDLE");
          scheduleWalk();
        });
      }, 500 + Math.random() * 900);
    }

    scheduleWalk();
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setActiveWheelId(null);
      setIsInHouse(false);
      setHouseActivityPosition(null);
    };
  }, [busy, cageItems, detailOpen, editing]);

  if (!hamster) return null;

  async function act(action: HamsterAction, nextBehavior: HamsterBehavior) {
    setBusy(true);
    const targetItem = cageItems.find((item) =>
      action === "FEED" ? item.itemId === "FOOD_BOWL"
      : action === "WATER" ? ["WATER_BOTTLE", "HANDHELD_WATER_BOTTLE", "WATER_BOWL"].includes(item.itemId)
      : false,
    );
    if (targetItem) {
      setBehavior("WALK");
      setFacing(targetItem.posX < hamsterPosition.x ? "left" : "right");
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
        setBusy(false);
      }, 900);
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

  function dragItem(event: PointerEvent<HTMLDivElement>) {
    if (!editing || !draggingItemId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewPosition({
      x: Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0.15, Math.min(0.85, (event.clientY - rect.top) / rect.height)),
    });
  }

  async function finishDrag() {
    if (!draggingItemId || !previewPosition) return;
    try {
      await moveCageItem(draggingItemId, previewPosition.x, previewPosition.y);
      showToast("가구 위치를 저장했어요.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "가구를 옮기지 못했어요.");
    } finally {
      setDraggingItemId(null);
      setSelectedItemId(null);
      setPreviewPosition(null);
    }
  }

  const stats = hamster.stats;
  const activeWheel = cageItems.find((item) => item.id === activeWheelId);
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
          onPointerMove={dragItem}
          onPointerUp={finishDrag}
          onPointerCancel={() => { setDraggingItemId(null); setPreviewPosition(null); }}
          className={`relative aspect-[10/7] min-h-72 overflow-hidden rounded-2xl border-4 border-brown/20 bg-[linear-gradient(#d9f0c4_0_58%,#e7c58c_58%)] ${editing ? "cursor-crosshair" : ""}`}
        >
          {cageItems.map((item) => {
            const itemAsset = item.itemId in ITEM_ASSET
              ? ITEM_ASSET[item.itemId as keyof typeof ITEM_ASSET]
              : null;
            const assetSrc = item.id === activeWheelId
              ? WHEEL_SPIN_FRAMES[wheelFrameIndex]
              : itemAsset?.src;
            return (
              <button
              type="button"
              key={item.id}
              onClick={(event) => {
                event.stopPropagation();
                if (editing) setSelectedItemId(item.id);
              }}
              onPointerDown={(event) => {
                if (!editing) return;
                event.preventDefault();
                setSelectedItemId(item.id);
                setDraggingItemId(item.id);
                setPreviewPosition({ x: item.posX, y: item.posY });
              }}
              title={ITEM_MASTERS[item.itemId].name}
              className={`absolute -translate-x-1/2 -translate-y-1/2 drop-shadow ${selectedItemId === item.id ? "rounded-xl ring-4 ring-accent-pink" : ""}`}
              style={{
                left: `${(draggingItemId === item.id && previewPosition ? previewPosition.x : item.posX) * 100}%`,
                top: `${(draggingItemId === item.id && previewPosition ? previewPosition.y : item.posY) * 100}%`,
                touchAction: "none",
              }}
            >
              {itemAsset && assetSrc ? (
                <img
                  src={assetSrc}
                  alt={ITEM_MASTERS[item.itemId].name}
                  className={`h-auto max-w-none ${itemAsset.width}`}
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <span className="text-4xl md:text-6xl">🪵</span>
              )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); if (!editing) setDetailOpen(true); }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-[850ms] ${isInHouse ? "pointer-events-none opacity-0" : "opacity-100"}`}
            style={{ left: `${hamsterPosition.x * 100}%`, top: `${hamsterPosition.y * 100}%` }}
          >
            <HamsterSprite
              appearance={hamster.appearance}
              behavior={behavior}
              facing={facing}
              size={activeWheelId ? 105 : 160}
              className={activeWheelId ? "animate-bounce" : ""}
            />
          </button>
          {activeWheelId && (
            <span
              className="absolute -translate-x-1/2 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold"
              style={{ left: `${(activeWheel?.posX ?? 0.5) * 100}%`, top: `${Math.max(0.1, (activeWheel?.posY ?? 0.7) - 0.2) * 100}%` }}
            >
              쳇바퀴 타는 중
            </span>
          )}
          {isInHouse && houseActivityPosition && (
            <span
              className="absolute -translate-x-1/2 rounded-full bg-card/90 px-3 py-1 text-sm font-bold"
              style={{ left: `${houseActivityPosition.x * 100}%`, top: `${Math.max(0.08, houseActivityPosition.y - 0.18) * 100}%` }}
            >
              Z z z
            </span>
          )}
          {editing && (
            <p className="absolute inset-x-3 top-3 rounded-lg bg-card/90 p-2 text-center text-sm">
              {selectedItemId ? "가구를 끌거나 새 위치를 눌러 주세요." : "옮길 가구를 선택해 주세요."}
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
