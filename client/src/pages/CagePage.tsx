// 햄스터를 돌보고 가구를 배치하는 메인 케이지 화면.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type { HamsterAction, HamsterBehavior, IdleActivityItemId } from "@shared/types/hamster";
import { ITEM_MASTERS } from "@shared/types/cage";
import HamsterSprite from "../components/hamster/HamsterSprite";
import Modal from "../components/common/Modal";
import PixelButton from "../components/common/PixelButton";
import StatusBar from "../components/common/StatusBar";
import { useToast } from "../components/common/Toast";
import { useGameState } from "../context/GameStateContext";
import { CAGE_ITEM_IMAGE } from "../lib/cageItemAssets";
import cageBackground from "../assets/cage/background.png";
import wheelSpin1 from "../assets/cage-items/wheel-spin/frame-01.png";
import wheelSpin2 from "../assets/cage-items/wheel-spin/frame-02.png";
import wheelSpin3 from "../assets/cage-items/wheel-spin/frame-03.png";
import wheelSpin4 from "../assets/cage-items/wheel-spin/frame-04.png";
import wheelSpin5 from "../assets/cage-items/wheel-spin/frame-05.png";
import wheelSpin6 from "../assets/cage-items/wheel-spin/frame-06.png";
import wheelSpin7 from "../assets/cage-items/wheel-spin/frame-07.png";
import wheelSpin8 from "../assets/cage-items/wheel-spin/frame-08.png";
import wheelSpin9 from "../assets/cage-items/wheel-spin/frame-09.png";
import wheelSpin10 from "../assets/cage-items/wheel-spin/frame-10.png";
import wheelSpin11 from "../assets/cage-items/wheel-spin/frame-11.png";
import wheelSpin12 from "../assets/cage-items/wheel-spin/frame-12.png";

const ACTIONS: Array<{ id: HamsterAction; label: string; behavior: HamsterBehavior }> = [
  { id: "FEED", label: "밥 주기", behavior: "EAT" },
  { id: "WATER", label: "물 주기", behavior: "DRINK" },
  { id: "PET", label: "쓰다듬기", behavior: "PET" },
  { id: "WASH", label: "세수하기", behavior: "WASH" },
];

// 걷기는 프레임 자체가 움직이고 대기는 눈 깜박임이 있어 따로 손댈 필요가 없다. 그 외 정지 그림
// 행동은 몇 초씩 완전히 굳어 보이므로 animate-action-loop로 미세한 반복 동작을 얹는다.
const LOOPING_BEHAVIORS: HamsterBehavior[] = ["LOOK", "EAT", "DRINK", "SLEEP", "PET", "WASH", "CHEEK"];

// 케이지에서의 표시 크기를 스테이지 폭 대비 비율로 둔다.
// 화면 크기와 무관하게 햄스터와 가구의 비율이 같아야 PC와 모바일이 같은 장면으로 보인다.
// (예전에는 가구만 반응형 px이고 햄스터는 160px 고정이라 모바일에서 햄스터만 커 보였다)
const ITEM_ASSET = {
  FOOD_BOWL: { src: CAGE_ITEM_IMAGE.FOOD_BOWL, widthRatio: 0.13 },
  // 물병 그림은 세로로 길어(가로의 2.2배) 폭 기준으로 잡으면 키가 햄스터의 1.8배가 된다.
  // 옆에 서면 햄스터가 작아 보여서 실제 사육장처럼 햄스터 키와 비슷해지도록 낮춘다.
  WATER_BOTTLE: { src: CAGE_ITEM_IMAGE.WATER_BOTTLE, widthRatio: 0.073 },
  HANDHELD_WATER_BOTTLE: { src: CAGE_ITEM_IMAGE.HANDHELD_WATER_BOTTLE, widthRatio: 0.087 },
  WATER_BOWL: { src: CAGE_ITEM_IMAGE.WATER_BOWL, widthRatio: 0.13 },
  HOUSE: { src: CAGE_ITEM_IMAGE.HOUSE, widthRatio: 0.196 },
  WHEEL: { src: CAGE_ITEM_IMAGE.WHEEL, widthRatio: 0.239 },
  // 햄스터가 안에 들어가 모래 위에 앉는다. 몸이 통 폭의 3분의 1 정도가 되도록 넉넉히 잡는다.
  SAND_BATH: { src: CAGE_ITEM_IMAGE.SAND_BATH, widthRatio: 0.348 },
  SNACK_DISH: { src: CAGE_ITEM_IMAGE.SNACK_DISH, widthRatio: 0.13 },
  LOOKOUT: { src: CAGE_ITEM_IMAGE.LOOKOUT, widthRatio: 0.196 },
} as const;

// 햄스터 스프라이트 상자의 폭도 같은 기준으로 잡는다. 쳇바퀴 안에 들어갈 때만 작게 그린다.
const HAMSTER_WIDTH_RATIO = 0.217;
const HAMSTER_ON_WHEEL_RATIO = 0.143;
// 스테이지를 아직 못 쟀을 때 쓸 기본값. PC 기준 폭이라 첫 페인트가 크게 어긋나지 않는다.
const FALLBACK_STAGE_WIDTH = 736;
const FALLBACK_STAGE_HEIGHT = FALLBACK_STAGE_WIDTH * 0.7;

// 픽셀 아트는 홀수 크기의 절반이나 % 좌표가 0.5px에 걸리면 브라우저 합성 과정에서 흐려진다.
// 짝수 크기 + 정수 위치를 사용하면 translate(-50%) 이후에도 실제 픽셀 경계에 정확히 놓인다.
function evenPixel(value: number) {
  return Math.max(2, Math.round(value / 2) * 2);
}

// 쓰다듬을 때 떠오르는 하트가 사라지기까지의 시간. index.css의 애니메이션 길이와 맞춘다.
const PET_HEART_MS = 1000;
// 하트가 뜨는 높이(스테이지 높이 비율). 햄스터 머리 위에서 시작한다.
const PET_HEART_RISE = 0.09;
// 발판(10개, 36도 주기)과 스포크(4개, 90도 주기)가 겹치는 무늬는 180도마다 완전히 반복돼
// 12프레임이 180도를 15도씩 나눠 찍은 것만으로 이미 끊김 없는 한 바퀴 회전으로 보인다.
const WHEEL_SPIN_FRAMES = [
  wheelSpin1, wheelSpin2, wheelSpin3, wheelSpin4, wheelSpin5, wheelSpin6,
  wheelSpin7, wheelSpin8, wheelSpin9, wheelSpin10, wheelSpin11, wheelSpin12,
];

// 가구를 보유하고 있을 때 햄스터가 스스로 하는 행동. 위에서부터 차례로 확률 구간을 차지한다.
// 확률을 낮게 둬서 "걷다가 가끔 뭘 한다"가 되게 한다. 5종을 다 가져도 한 번에 25%다.
// offsetX/offsetY는 가구를 기준으로 햄스터가 설 자리다. 그림 위에 겹쳐 서지 않게 조정한다.
const IDLE_ACTIVITIES: Array<{
  itemId: IdleActivityItemId;
  behavior: HamsterBehavior;
  durationMs: number;
  chance: number;
  offsetX?: number;
  offsetY?: number;
}> = [
  { itemId: "WHEEL", behavior: "WALK", durationMs: 3000, chance: 0.05, offsetY: 0.04 },
  // 집 안으로 사라지는 대신 집 앞에 자리를 잡고 잔다. 집은 보통 위쪽에 놓여 있어 아래로 넉넉히 내린다.
  { itemId: "HOUSE", behavior: "SLEEP", durationMs: 3600, chance: 0.05, offsetX: 0.03, offsetY: 0.16 },
  // 통 앞이 아니라 안에 들어가 모래 위에 앉는다. 발이 모래면에 닿도록 위로 올린다.
  { itemId: "SAND_BATH", behavior: "WASH", durationMs: 2800, chance: 0.05, offsetY: -0.19 },
  { itemId: "SNACK_DISH", behavior: "CHEEK", durationMs: 2600, chance: 0.05, offsetY: 0.02 },
  { itemId: "LOOKOUT", behavior: "LOOK", durationMs: 2800, chance: 0.05, offsetY: 0.04 },
];

// 가구 행동 뒤에는 최소 이만큼의 걷기/쉬기가 지나야 다시 가구로 간다. 연속으로 몰리는 걸 막는다.
const ACTIVITY_MIN_GAP = 2;
// 동작과 동작 사이에 서 있는 시간
const PAUSE_MIN_MS = 2000;
const PAUSE_RANGE_MS = 3000;
// 걷지 않고 제자리에서 쉬기만 하는 비율과 그 길이.
// 쉬기가 연달아 나오면 10초 넘게 멈춰 있어 고장 난 것처럼 보이므로 연속으로는 한 번만 허용한다.
const REST_CHANCE = 0.3;
const REST_MIN_MS = 1600;
const REST_RANGE_MS = 1600;

// 케이지 폭 기준 이동 속도(ms당 비율). 거리에 비례해 시간을 정해야 속도가 일정해 보인다.
const WALK_SPEED_PER_MS = 0.00014;
const MIN_WALK_MS = 1100;
const MAX_WALK_MS = 4200;
// 스테이지가 가로로 길어 세로 이동은 체감 거리가 짧다. 시간 계산에서 가중치를 낮춘다.
const STAGE_Y_WEIGHT = 0.7;

interface StagePoint {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function walkDurationMs(from: StagePoint, to: StagePoint) {
  const distance = Math.hypot(to.x - from.x, (to.y - from.y) * STAGE_Y_WEIGHT);
  return clamp(Math.round(distance / WALK_SPEED_PER_MS), MIN_WALK_MS, MAX_WALK_MS);
}

// 케이지를 가로지르지 않고 지금 자리에서 조금씩 옮겨 다니게 한다. 가장자리에서는 안쪽으로 돈다.
function wanderTarget(from: StagePoint): StagePoint {
  let directionX = Math.random() < 0.5 ? -1 : 1;
  if (from.x < 0.3) directionX = 1;
  if (from.x > 0.7) directionX = -1;
  return {
    x: clamp(from.x + directionX * (0.14 + Math.random() * 0.24), 0.18, 0.82),
    y: clamp(from.y + (Math.random() - 0.5) * 0.12, 0.52, 0.78),
  };
}

export default function CagePage() {
  const { hamster, cageItems, performHamsterAction, performIdleActivity, moveCageItem } = useGameState();
  const { showToast } = useToast();
  // 30분 넘게 자리를 비우면 서버가 재워둔다(tickHamsterState). 화면이 이걸 그냥 무시하고 있었다.
  const isSleeping = hamster?.state === "SLEEPING";
  const [behavior, setBehavior] = useState<HamsterBehavior>(() =>
    isSleeping ? "SLEEP" : "IDLE",
  );
  // 자고 있는 채로 접속했으면 집 앞에서 자는 걸로 시작한다. 집이 아직 없으면(있을 수 없지만) 기본 위치.
  const [hamsterPosition, setHamsterPosition] = useState<StagePoint>(() => {
    if (isSleeping) {
      const house = cageItems.find((item) => item.itemId === "HOUSE");
      if (house) {
        return { x: clamp(house.posX + 0.03, 0.18, 0.82), y: clamp(house.posY + 0.16, 0.35, 0.8) };
      }
    }
    return { x: 0.5, y: 0.68 };
  });
  // 이동 거리에 따라 매번 달라진다. 스프라이트의 CSS 전환 시간에 그대로 쓴다.
  const [moveDurationMs, setMoveDurationMs] = useState(MIN_WALK_MS);
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [busy, setBusy] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);
  const [wheelFrameIndex, setWheelFrameIndex] = useState(0);
  // 쓰다듬기 연출
  const [petEffects, setPetEffects] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [squishing, setSquishing] = useState(false);
  const petEffectIdRef = useRef(0);
  // 스테이지 실제 폭. 모든 스프라이트 크기를 여기에 비례시켜 PC와 모바일의 비율을 맞춘다.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(FALLBACK_STAGE_WIDTH);
  const [stageHeight, setStageHeight] = useState(FALLBACK_STAGE_HEIGHT);

  // 첫 페인트 전에 재야 큰 크기로 그렸다가 줄어드는 깜빡임이 없다.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    setStageWidth(stage.clientWidth);
    setStageHeight(stage.clientHeight);
    const observer = new ResizeObserver(([entry]) => {
      setStageWidth(entry.contentRect.width);
      setStageHeight(entry.contentRect.height);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeWheelId) {
      setWheelFrameIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setWheelFrameIndex((current) => (current + 1) % WHEEL_SPIN_FRAMES.length);
    }, 90);
    return () => window.clearInterval(timer);
  }, [activeWheelId]);

  // 자율 행동을 서버에 보고하면 상태가 새로 내려와 cageItems의 참조가 바뀐다. 그걸 그대로 의존성에 두면
  // 연출 루프가 매번 처음부터 다시 시작하므로, 배치가 실제로 바뀐 경우에만 재시작하도록 키로 비교한다.
  const cageItemsRef = useRef(cageItems);
  const cageLayoutKey = cageItems
    .map((item) => `${item.id}:${item.itemId}:${item.posX}:${item.posY}`)
    .join("|");

  useEffect(() => {
    cageItemsRef.current = cageItems;
  }, [cageItems]);

  // 타이머 콜백에서 현재 위치를 읽어야 이동 거리를 계산할 수 있다.
  const hamsterPositionRef = useRef(hamsterPosition);
  useEffect(() => {
    hamsterPositionRef.current = hamsterPosition;
  }, [hamsterPosition]);

  // 가구 행동 이후 지나간 평범한 사이클 수. 연출이 다시 시작돼도 유지되도록 ref에 둔다.
  const cyclesSinceActivityRef = useRef(ACTIVITY_MIN_GAP);
  const restedLastCycleRef = useRef(false);

  // 자는 동안 자율 행동 루프가 재우기 전 자세로 덮어써 버리지 않도록 자는 자세를 다시 못박는다.
  useEffect(() => {
    if (isSleeping) setBehavior("SLEEP");
  }, [isSleeping]);

  useEffect(() => {
    if (busy || editing || detailOpen || isSleeping) return;
    const timers: number[] = [];

    function later(callback: () => void, delay: number) {
      const timer = window.setTimeout(callback, delay);
      timers.push(timer);
    }

    function walkTo(target: StagePoint, onArrive: () => void) {
      const from = hamsterPositionRef.current;
      const duration = walkDurationMs(from, target);
      setFacing(target.x < from.x ? "left" : "right");
      setMoveDurationMs(duration);
      setHamsterPosition(target);
      setBehavior("WALK");
      // 도착하자마자 다음 동작으로 넘어가면 급해 보여서 잠시 멈춘 뒤 이어간다.
      later(onArrive, duration + 300);
    }

    // 연출이 끝나면 서버에 알려 수치와 행동 도감에 반영한다. 실패해도 화면은 계속 돌아간다.
    function reportActivity(itemId: IdleActivityItemId) {
      performIdleActivity(itemId).catch(() => {});
    }

    function scheduleWalk() {
      later(() => {
        const activityRoll = Math.random();
        let threshold = 0;
        // 방금 가구를 썼으면 이번 사이클은 걷기/쉬기만 한다.
        const canUseFurniture = cyclesSinceActivityRef.current >= ACTIVITY_MIN_GAP;

        for (const activity of canUseFurniture ? IDLE_ACTIVITIES : []) {
          const item = cageItemsRef.current.find((candidate) => candidate.itemId === activity.itemId);
          // 보유한 가구만 확률 구간을 차지한다. 하나만 있어도 그 행동이 제 확률대로 나온다.
          if (!item) continue;
          threshold += activity.chance;
          if (activityRoll >= threshold) continue;

          cyclesSinceActivityRef.current = 0;

          // 가구는 위쪽(벽 쪽)에도 놓을 수 있으므로 산책 범위(0.5~0.78)보다 위까지 갈 수 있게 둔다.
          const spot = {
            x: clamp(item.posX + (activity.offsetX ?? 0), 0.18, 0.82),
            y: clamp(item.posY + (activity.offsetY ?? 0), 0.35, 0.8),
          };
          walkTo(spot, () => {
            if (activity.itemId === "WHEEL") setActiveWheelId(item.id);
            setBehavior(activity.behavior);
            later(() => {
              setActiveWheelId(null);
              setBehavior("IDLE");
              reportActivity(activity.itemId);
              scheduleWalk();
            }, activity.durationMs);
          });
          return;
        }

        cyclesSinceActivityRef.current += 1;

        // 매번 걷지는 않는다. 가끔은 그냥 그 자리에 서서 쉰다.
        if (!restedLastCycleRef.current && Math.random() < REST_CHANCE) {
          restedLastCycleRef.current = true;
          setBehavior("IDLE");
          later(scheduleWalk, REST_MIN_MS + Math.random() * REST_RANGE_MS);
          return;
        }

        restedLastCycleRef.current = false;
        walkTo(wanderTarget(hamsterPositionRef.current), () => {
          setBehavior("IDLE");
          scheduleWalk();
        });
      }, PAUSE_MIN_MS + Math.random() * PAUSE_RANGE_MS);
    }

    scheduleWalk();
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setActiveWheelId(null);
    };
    // cageItems와 performIdleActivity는 매번 새 참조라 의존성에 넣으면 연출이 끊긴다.
    // 배치 변경은 cageLayoutKey로, 최신 목록은 cageItemsRef로 받는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, cageLayoutKey, detailOpen, editing, isSleeping]);

  if (!hamster) return null;

  // 햄스터를 직접 클릭하면 쓰다듬는다. 하트가 떠오르고 몸이 살짝 눌렸다 돌아온다.
  function petByClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (editing || busy) return;

    const id = petEffectIdRef.current;
    petEffectIdRef.current += 1;
    setPetEffects((current) => [
      ...current,
      { id, x: hamsterPositionRef.current.x, y: hamsterPositionRef.current.y },
    ]);
    window.setTimeout(() => {
      setPetEffects((current) => current.filter((effect) => effect.id !== id));
    }, PET_HEART_MS);

    // 이미 재생 중이면 클래스를 한 번 뗐다 붙여야 애니메이션이 처음부터 다시 돈다.
    setSquishing(false);
    window.requestAnimationFrame(() => setSquishing(true));

    void act("PET", "PET", { silent: true });
  }

  // silent는 햄스터를 직접 클릭해 쓰다듬을 때 쓴다. 연달아 누르면 토스트가 계속 쌓여서
  // 하트 연출로만 알리고 성공 토스트는 생략한다. 오류는 그대로 알린다.
  async function act(
    action: HamsterAction,
    nextBehavior: HamsterBehavior,
    options?: { silent?: boolean },
  ) {
    setBusy(true);
    const targetItem = cageItems.find((item) =>
      action === "FEED" ? item.itemId === "FOOD_BOWL"
      : action === "WATER" ? ["WATER_BOTTLE", "HANDHELD_WATER_BOTTLE", "WATER_BOWL"].includes(item.itemId)
      : false,
    );
    if (targetItem) {
      // 가구는 스테이지 가장자리(x 0.08~0.92)까지 놓을 수 있지만 햄스터 중심을 그 좌표에
      // 그대로 두면 정사각 스프라이트의 일부가 overflow-hidden 경계 밖으로 잘린다.
      // 특히 오른쪽을 향한 WALK 그림은 머리 쪽이 먼저 잘려 이동하면서 작아지는 것처럼 보인다.
      // 산책과 같은 안전 영역 안에 몸을 두되, 세로 위치는 가구 아래쪽을 유지한다.
      const target = {
        x: clamp(targetItem.posX, 0.18, 0.82),
        y: Math.min(0.82, targetItem.posY + 0.12),
      };
      const duration = walkDurationMs(hamsterPosition, target);
      setBehavior("WALK");
      setFacing(target.x < hamsterPosition.x ? "left" : "right");
      setMoveDurationMs(duration);
      setHamsterPosition(target);
      await new Promise((resolve) => window.setTimeout(resolve, duration));
    }
    setBehavior(nextBehavior);
    try {
      await performHamsterAction(action);
      if (!options?.silent) showToast(`${hamster!.name}에게 잘 전해졌어요.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "행동을 완료하지 못했어요.");
    } finally {
      // 가운데로 되돌리지 않는다. 있던 자리에 그대로 두면 이어지는 자율 행동이 자연스럽다.
      window.setTimeout(() => {
        setBehavior("IDLE");
        setBusy(false);
      }, 1200);
    }
  }

  async function placeItem(event: MouseEvent<HTMLDivElement>) {
    if (!editing || !selectedItemId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const posX = Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width));
    // 배경의 바닥은 0.35부터다. 그 위는 유리벽이라 가구를 놓으면 허공에 떠 보인다.
    const posY = Math.max(0.35, Math.min(0.85, (event.clientY - rect.top) / rect.height));
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
      y: Math.max(0.35, Math.min(0.85, (event.clientY - rect.top) / rect.height)),
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
  const hamsterSize = evenPixel(
    (activeWheelId ? HAMSTER_ON_WHEEL_RATIO : HAMSTER_WIDTH_RATIO) * stageWidth,
  );
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-3 md:p-6">
      {/* 좌우 분할을 md(768px)에서 하면 좌측 메뉴까지 겹쳐 케이지가 300px 아래로 줄어든다. lg부터 나눈다 */}
      <section className="grid gap-4 rounded-2xl bg-card p-4 shadow-sm lg:grid-cols-[220px_1fr]">
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
          ref={stageRef}
          onClick={placeItem}
          onPointerMove={dragItem}
          onPointerUp={finishDrag}
          onPointerCancel={() => { setDraggingItemId(null); setPreviewPosition(null); }}
          // min-h를 두면 좁은 화면에서 10:7 비율이 깨져 위치 계산과 어긋난다.
          // 배경은 1000x700 고정 그림이라 스테이지 비율(10:7)이 항상 같아 100% 100%로 늘려도 안 찌그러진다.
          className={`relative aspect-[10/7] overflow-hidden rounded-2xl border-4 border-brown/20 ${editing ? "cursor-crosshair" : ""}`}
          style={{ backgroundImage: `url(${cageBackground})`, backgroundSize: "100% 100%" }}
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
                  className="h-auto max-w-none"
                  style={{
                    width: `${itemAsset.widthRatio * stageWidth}px`,
                    imageRendering: "pixelated",
                  }}
                />
              ) : (
                <span className="text-4xl md:text-6xl">🪵</span>
              )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={petByClick}
            title={editing ? undefined : `${hamster.name} ${isSleeping ? "깨우기" : "쓰다듬기"}`}
            aria-label={`${hamster.name} ${isSleeping ? "깨우기" : "쓰다듬기"}`}
            disabled={editing}
            className="absolute -translate-x-1/2 -translate-y-1/2 leading-none disabled:cursor-default"
            style={{
              // absolute + width:auto 버튼은 오른쪽 남은 공간에 따라 shrink-to-fit 된다.
              // 버튼 자체를 햄스터 크기로 고정해 자식 img의 크기가 위치에 영향받지 않게 한다.
              width: `${hamsterSize}px`,
              height: `${hamsterSize}px`,
              minWidth: `${hamsterSize}px`,
              // % 좌표 대신 정수 px로 끝점을 고정한다. 오른쪽 끝의 특정 소수 좌표에서만
              // 스프라이트 전체가 보간되어 작아 보이던 현상을 막는다.
              left: `${Math.round(hamsterPosition.x * stageWidth)}px`,
              top: `${Math.round(hamsterPosition.y * stageHeight)}px`,
              transitionProperty: "left, top",
              transitionDuration: `${moveDurationMs}ms`,
              transitionTimingFunction: "ease-in-out",
            }}
          >
            {/* 버튼 자체에는 위치 이동용 transform이 걸려 있어 눌리는 연출은 안쪽에 따로 준다 */}
            <div
              style={{ width: hamsterSize, height: hamsterSize }}
              className={
                squishing
                  ? "animate-pet-squish"
                  : LOOPING_BEHAVIORS.includes(behavior)
                    ? "animate-action-loop"
                    : ""
              }
              onAnimationEnd={() => setSquishing(false)}
            >
              <HamsterSprite
                appearance={hamster.appearance}
                behavior={behavior}
                facing={facing}
                size={hamsterSize}
                className={`block ${activeWheelId ? "animate-bounce" : ""}`}
                // 쳇바퀴는 빠르게 달리는 연출이라 원래 속도로, 케이지 산책은 느긋하게 재생한다.
                frameIntervalMs={activeWheelId ? 160 : 360}
              />
            </div>
          </button>
          {petEffects.map((effect) => (
            <span
              key={effect.id}
              aria-hidden
              className="animate-heart-float pointer-events-none absolute select-none"
              style={{
                left: `${effect.x * 100}%`,
                // 머리 위에서 떠오르게 한다. 위치 기준점에서 그대로 띄우면 얼굴을 가린다.
                top: `${(effect.y - PET_HEART_RISE) * 100}%`,
                fontSize: `${Math.round(HAMSTER_WIDTH_RATIO * stageWidth * 0.24)}px`,
              }}
            >
              💗
            </span>
          ))}
          {activeWheelId && (
            <span
              className="absolute -translate-x-1/2 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold"
              style={{ left: `${(activeWheel?.posX ?? 0.5) * 100}%`, top: `${Math.max(0.1, (activeWheel?.posY ?? 0.7) - 0.2) * 100}%` }}
            >
              쳇바퀴 타는 중
            </span>
          )}
          {editing ? (
            <p className="absolute inset-x-3 top-3 rounded-lg bg-card/90 p-2 text-center text-sm">
              {selectedItemId ? "가구를 끌거나 새 위치를 눌러 주세요." : "옮길 가구를 선택해 주세요."}
            </p>
          ) : isSleeping ? (
            <p className="absolute inset-x-3 top-3 rounded-lg bg-card/90 p-2 text-center text-sm">
              잠들어 있어요. 쓰다듬거나 깨우기 버튼을 눌러 주세요.
            </p>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {/* 자는 동안은 밥/물/세수 대신 깨우기만 내보낸다. 실제로는 쓰다듬기와 같은 호출이라
            서버가 이미 하던 대로(state를 IDLE로) 깨워준다 - 클릭으로 깨우는 것과 같은 경로다. */}
        {isSleeping ? (
          <PixelButton className="col-span-2 md:col-span-4" disabled={busy} onClick={() => act("PET", "PET")}>
            깨우기
          </PixelButton>
        ) : (
          ACTIONS.map((action) => (
            <PixelButton key={action.id} disabled={busy || editing} onClick={() => act(action.id, action.behavior)}>
              {action.label}
            </PixelButton>
          ))
        )}
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
