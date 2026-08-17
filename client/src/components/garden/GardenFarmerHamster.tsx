import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import farmerIdle from "../../assets/garden/golden-farmer-hamster.png";
import harvestedCarrot from "../../assets/garden/carrot-harvested.png";
import harvestFrame3RightHand from "../../assets/garden/farmer-harvest-carrot-01/right-hand-03.png";

const walkModules = import.meta.glob("/src/assets/garden/farmer-walk-01/frame-*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const plantModules = import.meta.glob("/src/assets/garden/farmer-plant-01/frame-*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const weedModules = import.meta.glob("/src/assets/garden/farmer-weed-01/frame-*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const waterModules = import.meta.glob("/src/assets/garden/farmer-water-01/frame-*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const harvestCarrotModules = import.meta.glob("/src/assets/garden/farmer-harvest-carrot-01/frame-*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const COLUMN_X = [14, 38, 62, 86];
const ROW_WORK_Y = [24, 45, 66, 86];
// 수확 연출을 칸별로 확인하는 동안에는 평상시 배회와 선택 칸 추적을 멈춘다.
const ENABLE_IDLE_MOVEMENT = false;
// 단계별 수확 연출 검수용. true이면 오른쪽 정렬 후 1번 프레임에서 멈추며 실제 수확하지 않는다.
const HARVEST_ALIGNMENT_PREVIEW = true;
// 0부터 시작한다. 현재는 세 번째 프레임을 단독 검수한다.
const HARVEST_PREVIEW_FRAME_INDEX = 2;
const HARVEST_WORK_OFFSET = { x: -3, y: 0 };
// 당근을 뽑는 동안 밭에서 흔들리는 시간. 이 뒤에 손에 든 당근으로 바뀐다.
const HARVEST_PULL_MS = 900;
type PlantSidePosition = { x: number; y: number };
type PlantActionPosition = { seedX: number; left: PlantSidePosition; right: PlantSidePosition };

// 라인 × 칸별 심기 위치. left/right는 햄스터가 씨앗의 어느 쪽에 서는지를 뜻한다.
const PLANT_ACTION_POSITIONS: PlantActionPosition[][] = [
  [
    { seedX: 16, left: { x: 13, y: 17.5 }, right: { x: 22, y: 17.5 } },
    { seedX: 40.5, left: { x: 34, y: 17.5 }, right: { x: 44, y: 17.5 } },
    { seedX: 63.5, left: { x: 57, y: 17.5 }, right: { x: 66, y: 17.5 } },
    { seedX: 86, left: { x: 77, y: 17.5 }, right: { x: 88, y: 17.5 } },
  ],
  [
    { seedX: 16, left: { x: 13, y: 38 }, right: { x: 22, y: 38 } },
    { seedX: 40.5, left: { x: 34, y: 38 }, right: { x: 44, y: 38 } },
    { seedX: 63.5, left: { x: 57, y: 38 }, right: { x: 66, y: 38 } },
    { seedX: 86, left: { x: 77, y: 38 }, right: { x: 88, y: 38 } },
  ],
  [
    { seedX: 16, left: { x: 13, y: 58 }, right: { x: 22, y: 58 } },
    { seedX: 40.5, left: { x: 34, y: 58 }, right: { x: 44, y: 58 } },
    { seedX: 63.5, left: { x: 57, y: 58 }, right: { x: 66, y: 58 } },
    { seedX: 86, left: { x: 77, y: 58 }, right: { x: 88, y: 58 } },
  ],
  [
    { seedX: 16, left: { x: 13, y: 78 }, right: { x: 22, y: 78 } },
    { seedX: 40.5, left: { x: 34, y: 78 }, right: { x: 44, y: 78 } },
    { seedX: 63.5, left: { x: 57, y: 78 }, right: { x: 66, y: 78 } },
    { seedX: 86, left: { x: 77, y: 78 }, right: { x: 88, y: 78 } },
  ],
];

// 물주기 전용 위치 보정. right는 현재 위치를 유지하고 left만 별도로 조정할 수 있다.
// x: 양수면 오른쪽, 음수면 왼쪽 / y: 양수면 아래, 음수면 위
const WATER_ACTION_OFFSETS: Record<"left" | "right", PlantSidePosition> = {
  left: { x: -2, y: 0 },
  right: { x: 0, y: 0 },
};
const WANDER_POINTS = [
  { x: 13, y: 31 }, { x: 37, y: 31 }, { x: 63, y: 31 }, { x: 87, y: 31 },
  { x: 13, y: 52 }, { x: 37, y: 52 }, { x: 63, y: 52 }, { x: 87, y: 52 },
  { x: 13, y: 73 }, { x: 37, y: 73 }, { x: 63, y: 73 }, { x: 87, y: 73 },
];
const HORIZONTAL_PATH_Y = [31, 52, 73];
const LEFT_OUTER_PATH_X = 7;
const RIGHT_OUTER_PATH_X = 93;

type Position = { x: number; y: number };

export type GardenFarmerCommand = {
  id: number;
  type: "plant" | "weed" | "water" | "harvest";
  target: { rowIndex: number; slotIndex: number };
  side?: "left" | "right";
  perform: () => Promise<boolean>;
};

export default function GardenFarmerHamster({ target, command, onCommandComplete }: { target: { rowIndex: number; slotIndex: number } | null; command: GardenFarmerCommand | null; onCommandComplete: (id: number) => void }) {
  const walkFrames = useMemo(() => Object.entries(walkModules).sort(([a], [b]) => a.localeCompare(b)).map(([, src]) => src), []);
  const plantFrames = useMemo(() => Object.entries(plantModules).sort(([a], [b]) => a.localeCompare(b)).map(([, src]) => src), []);
  const weedFrames = useMemo(() => Object.entries(weedModules).sort(([a], [b]) => a.localeCompare(b)).map(([, src]) => src), []);
  const waterFrames = useMemo(() => Object.entries(waterModules).sort(([a], [b]) => a.localeCompare(b)).map(([, src]) => src), []);
  const harvestCarrotFrames = useMemo(() => Object.entries(harvestCarrotModules).sort(([a], [b]) => a.localeCompare(b)).map(([, src]) => src), []);
  const [position, setPosition] = useState<Position>({ x: 50, y: 52 });
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [moving, setMoving] = useState(false);
  const [planting, setPlanting] = useState(false);
  const [weeding, setWeeding] = useState(false);
  const [watering, setWatering] = useState(false);
  const [harvesting, setHarvesting] = useState(false);
  const [movementDuration, setMovementDuration] = useState(2400);
  const [frameIndex, setFrameIndex] = useState(0);
  const [harvestCropWidth, setHarvestCropWidth] = useState(0);
  const movementTimer = useRef<number | null>(null);
  const positionRef = useRef(position);
  const busyRef = useRef(false);
  const carriedCropRef = useRef<HTMLSpanElement>(null);

  const moveTo = useCallback((next: Position, durationMs = 1400) => {
    if (movementTimer.current !== null) window.clearTimeout(movementTimer.current);
    setFacing(next.x < positionRef.current.x ? "left" : "right");
    positionRef.current = next;
    setMovementDuration(durationMs);
    setMoving(true);
    setPosition(next);
    movementTimer.current = window.setTimeout(() => setMoving(false), durationMs);
  }, []);

  useEffect(() => {
    if (!ENABLE_IDLE_MOVEMENT || !target || busyRef.current) return;
    moveTo({ x: COLUMN_X[target.slotIndex] ?? 50, y: ROW_WORK_Y[target.rowIndex] ?? 52 }, 2400);
  }, [target?.rowIndex, target?.slotIndex, moveTo]);

  useEffect(() => {
    if (!ENABLE_IDLE_MOVEMENT) return;
    const wanderTimer = window.setInterval(() => {
      if (busyRef.current) return;
      const candidates = WANDER_POINTS.filter((point) => point.x !== positionRef.current.x || point.y !== positionRef.current.y);
      moveTo(candidates[Math.floor(Math.random() * candidates.length)], 3000);
    }, 6500);
    return () => window.clearInterval(wanderTimer);
  }, [moveTo]);

  useEffect(() => {
    const frames = harvesting ? harvestCarrotFrames : watering ? waterFrames : weeding ? weedFrames : planting ? plantFrames : walkFrames;
    if (harvesting && HARVEST_ALIGNMENT_PREVIEW) {
      setFrameIndex(0);
      return;
    }
    if ((!moving && !planting && !weeding && !watering && !harvesting) || frames.length < 2) {
      setFrameIndex(0);
      return;
    }
    const playingAction = planting || weeding || watering || harvesting;
    const animationTimer = window.setInterval(() => setFrameIndex((current) => playingAction ? Math.min(current + 1, frames.length - 1) : (current + 1) % frames.length), harvesting ? 260 : playingAction ? 380 : 130);
    return () => window.clearInterval(animationTimer);
  }, [moving, planting, weeding, watering, harvesting, walkFrames, plantFrames, weedFrames, waterFrames, harvestCarrotFrames]);

  useEffect(() => {
    if (!command) return;
    const activeCommand = command;
    let cancelled = false;
    const wait = (durationMs: number) => new Promise<void>((resolve) => window.setTimeout(resolve, durationMs));

    async function runCommand() {
      busyRef.current = true;
      let activeWeedElement: HTMLElement | null = null;
      let activeCropElement: HTMLElement | null = null;
      // 밭에서 실측한 작물 폭. 손에 든 작물에 px로 그대로 넘겨 크기를 일치시킨다.
      let activeCropWidth = 0;
      const positionConfig = PLANT_ACTION_POSITIONS[activeCommand.target.rowIndex]?.[activeCommand.target.slotIndex];
      const actionSide = activeCommand.side ?? (positionConfig && positionRef.current.x > positionConfig.seedX ? "right" : "left");
      let workPosition = positionConfig?.[actionSide] ?? { x: 50, y: 52 };

      if (activeCommand.type === "water") {
        const offset = WATER_ACTION_OFFSETS[actionSide];
        workPosition = { x: workPosition.x + offset.x, y: workPosition.y + offset.y };
      }

      if (activeCommand.type === "weed") {
        const stage = document.querySelector<HTMLElement>(".garden-stage");
        const weed = document.querySelector<HTMLElement>(
          `.garden-slot[data-garden-row="${activeCommand.target.rowIndex}"][data-garden-slot="${activeCommand.target.slotIndex}"] .garden-weed`,
        );
        if (stage && weed) {
          activeWeedElement = weed;
          const stageRect = stage.getBoundingClientRect();
          const weedRect = weed.getBoundingClientRect();
          const weedX = ((weedRect.left + weedRect.width / 2 - stageRect.left) / stageRect.width) * 100;
          const weedY = ((weedRect.top + weedRect.height / 2 - stageRect.top) / stageRect.height) * 100;
          workPosition = {
            x: weedX + (actionSide === "left" ? -4 : 2),
            y: weedY + (actionSide === "left" ? -1 : -2),          };
        }
      }


      if (activeCommand.type === "harvest") {
        const stage = document.querySelector<HTMLElement>(".garden-stage");
        const crop = document.querySelector<HTMLElement>(
          `.garden-slot[data-garden-row="${activeCommand.target.rowIndex}"][data-garden-slot="${activeCommand.target.slotIndex}"] .garden-atlas-sprite--ready`,
        );
        if (stage && crop) {
          activeCropElement = crop;
          const stageRect = stage.getBoundingClientRect();
          const cropRect = crop.getBoundingClientRect();
          activeCropWidth = cropRect.width;
          setHarvestCropWidth(cropRect.width);
          const cropX = ((cropRect.left + cropRect.width / 2 - stageRect.left) / stageRect.width) * 100;
          const cropY = ((cropRect.top + cropRect.height / 2 - stageRect.top) / stageRect.height) * 100;
          // 당근 수확은 좌우 경우의 수를 없애고 항상 당근 오른쪽에서 왼쪽을 바라본다.
          workPosition = { x: cropX + HARVEST_WORK_OFFSET.x, y: cropY + HARVEST_WORK_OFFSET.y };
        }
      }

      async function walkSegment(next: Position) {
        const distance = Math.hypot(next.x - positionRef.current.x, next.y - positionRef.current.y);
        if (distance < 0.5) return;
        const durationMs = Math.max(450, Math.round(distance * 48));
        moveTo(next, durationMs);
        await wait(durationMs);
      }

      const currentPathY = HORIZONTAL_PATH_Y.reduce((nearest, pathY) =>
        Math.abs(pathY - positionRef.current.y) < Math.abs(nearest - positionRef.current.y) ? pathY : nearest,
      );
      const targetPathY = activeCommand.target.rowIndex >= 3
        ? HORIZONTAL_PATH_Y[2]
        : HORIZONTAL_PATH_Y[activeCommand.target.rowIndex];
      const outerPathX = positionRef.current.x < 50 ? LEFT_OUTER_PATH_X : RIGHT_OUTER_PATH_X;

      // 밭에서 가까운 가로 길로 나온다.
      await walkSegment({ x: positionRef.current.x, y: currentPathY });
      if (cancelled) return;
      // 다른 라인이라면 외곽 세로 통로로 이동한 뒤 목표 라인의 길로 들어간다.
      if (currentPathY !== targetPathY) {
        await walkSegment({ x: outerPathX, y: currentPathY });
        if (cancelled) return;
        await walkSegment({ x: outerPathX, y: targetPathY });
        if (cancelled) return;
      }
      // 목표 칸 앞의 길을 따라 이동한 다음 밭으로 들어간다.
      await walkSegment({ x: workPosition.x, y: targetPathY });
      if (cancelled) return;
      await walkSegment(workPosition);
      if (cancelled) return;
      setMoving(false);
      setFacing(activeCommand.type === "harvest" ? "left" : actionSide === "left" ? "right" : "left");
      setFrameIndex(0);
      if (activeCommand.type === "plant") setPlanting(true);
      else if (activeCommand.type === "weed") setWeeding(true);
      else if (activeCommand.type === "water") setWatering(true);
      else {
        setHarvesting(true);
        if (HARVEST_ALIGNMENT_PREVIEW) {
          activeCropElement?.classList.add("garden-crop--picked");
          activeCropElement?.closest(".garden-slot")?.classList.add("garden-slot--harvest-preview");
          busyRef.current = false;
          onCommandComplete(activeCommand.id);
          return;
        }
        // 뽑히기 전까지는 밭의 작물이 그대로 흔들린다.
        activeCropElement?.classList.add("garden-crop--harvesting");
      }
      if (activeCommand.type === "harvest") {
        await wait(HARVEST_PULL_MS);
        if (cancelled) return;
        if (activeCropElement) {
          const carried = activeCropElement.cloneNode(true) as HTMLElement;
          carried.classList.remove("garden-crop--harvesting");
          carried.classList.add("garden-carried-crop");
          carried.style.width = `${activeCropWidth}px`;
          carriedCropRef.current?.replaceChildren(carried);
          activeCropElement.classList.remove("garden-crop--harvesting");
          activeCropElement.classList.add("garden-crop--picked");
        }
        await wait(660);
      } else {
        await wait(1520);
      }
      if (cancelled) return;
      if (activeCommand.type === "weed" && activeWeedElement) activeWeedElement.style.visibility = "hidden";
      const succeeded = await activeCommand.perform();
      if (!succeeded && activeWeedElement) activeWeedElement.style.visibility = "";
      if (!succeeded && activeCropElement) {
        activeCropElement.classList.remove("garden-crop--harvesting", "garden-crop--picked");
        carriedCropRef.current?.replaceChildren();
      }
      await wait(1000);
      if (cancelled) return;
      setPlanting(false);
      setWeeding(false);
      setWatering(false);
      setHarvesting(false);
      carriedCropRef.current?.replaceChildren();
      busyRef.current = false;
      onCommandComplete(activeCommand.id);
    }

    void runCommand();
    return () => { cancelled = true; carriedCropRef.current?.replaceChildren(); };
  }, [command, moveTo, onCommandComplete]);

  useEffect(() => () => {
    if (movementTimer.current !== null) window.clearTimeout(movementTimer.current);
  }, []);

  return (
    <div
      className={`garden-farmer-hamster ${harvesting && HARVEST_ALIGNMENT_PREVIEW ? `garden-farmer-hamster--harvest-frame-${HARVEST_PREVIEW_FRAME_INDEX + 1}` : ""} ${facing === "left" ? "garden-farmer-hamster--facing-left" : ""} ${moving ? "garden-farmer-hamster--moving" : planting ? "garden-farmer-hamster--planting" : weeding ? "garden-farmer-hamster--weeding" : watering ? "garden-farmer-hamster--watering" : harvesting ? "garden-farmer-hamster--harvesting" : "garden-farmer-hamster--idle"}`}
      style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: 10 + Math.round(position.y), transitionDuration: `${movementDuration}ms` }}
      aria-hidden="true"
    >
      {harvesting && HARVEST_ALIGNMENT_PREVIEW ? (
        <>
          <img className="garden-harvest-layer__hamster-base" src={harvestCarrotFrames[HARVEST_PREVIEW_FRAME_INDEX] ?? farmerIdle} alt="" />
          <img className="garden-harvest-layer__carrot" src={harvestedCarrot} alt="" style={{ width: harvestCropWidth > 0 ? `${harvestCropWidth}px` : undefined }} />
          <img className={`garden-harvest-layer__front-arm ${HARVEST_PREVIEW_FRAME_INDEX === 2 ? "garden-harvest-layer__front-arm--cutout" : ""}`} src={HARVEST_PREVIEW_FRAME_INDEX === 2 ? harvestFrame3RightHand : harvestCarrotFrames[HARVEST_PREVIEW_FRAME_INDEX] ?? farmerIdle} alt="" />
          <img className="garden-harvest-layer__front-leg" src={harvestCarrotFrames[HARVEST_PREVIEW_FRAME_INDEX] ?? farmerIdle} alt="" />
        </>
      ) : (
        <img src={harvesting ? harvestCarrotFrames[frameIndex] ?? farmerIdle : watering ? waterFrames[frameIndex] ?? farmerIdle : weeding ? weedFrames[frameIndex] ?? farmerIdle : planting ? plantFrames[frameIndex] ?? farmerIdle : moving ? walkFrames[frameIndex] ?? farmerIdle : farmerIdle} alt="" style={{ transform: facing === "left" ? "scaleX(-1)" : undefined }} />
      )}
      {/* 뽑은 작물이 들어갈 자리. 밭의 작물 요소를 복제해 넣으므로 크기가 항상 밭과 같다. */}
      <span ref={carriedCropRef} className="garden-carried-crop-holder" />
    </div>
  );
}
