import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import farmerIdle from "../../assets/garden/golden-farmer-hamster.png";

const walkModules = import.meta.glob("/src/assets/garden/farmer-walk-01/frame-*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const plantModules = import.meta.glob("/src/assets/garden/farmer-plant-01/frame-*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const COLUMN_X = [14, 38, 62, 86];
const ROW_WORK_Y = [24, 45, 66, 86];
// 위치 조정용 임시 고정 좌표: 3라인 1번째 칸.
const LOCK_FARMER_POSITION = true;
const FIXED_FARMER_POSITION = { x: 10, y: 10 };
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
  type: "plant";
  target: { rowIndex: number; slotIndex: number };
  perform: () => Promise<void>;
};

export default function GardenFarmerHamster({ target, command, onCommandComplete }: { target: { rowIndex: number; slotIndex: number } | null; command: GardenFarmerCommand | null; onCommandComplete: (id: number) => void }) {
  const walkFrames = useMemo(() => Object.entries(walkModules).sort(([a], [b]) => a.localeCompare(b)).map(([, src]) => src), []);
  const plantFrames = useMemo(() => Object.entries(plantModules).sort(([a], [b]) => a.localeCompare(b)).map(([, src]) => src), []);
  const [position, setPosition] = useState<Position>(LOCK_FARMER_POSITION ? FIXED_FARMER_POSITION : { x: 50, y: 52 });
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [moving, setMoving] = useState(false);
  const [planting, setPlanting] = useState(false);
  const [movementDuration, setMovementDuration] = useState(2400);
  const [frameIndex, setFrameIndex] = useState(0);
  const movementTimer = useRef<number | null>(null);
  const positionRef = useRef(position);
  const busyRef = useRef(false);

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
    if (LOCK_FARMER_POSITION || !target || busyRef.current) return;
    moveTo({ x: COLUMN_X[target.slotIndex] ?? 50, y: ROW_WORK_Y[target.rowIndex] ?? 52 }, 2400);
  }, [target?.rowIndex, target?.slotIndex, moveTo]);

  useEffect(() => {
    if (LOCK_FARMER_POSITION) return;
    const wanderTimer = window.setInterval(() => {
      if (busyRef.current) return;
      const candidates = WANDER_POINTS.filter((point) => point.x !== positionRef.current.x || point.y !== positionRef.current.y);
      moveTo(candidates[Math.floor(Math.random() * candidates.length)], 3000);
    }, 6500);
    return () => window.clearInterval(wanderTimer);
  }, [moveTo]);

  useEffect(() => {
    const frames = planting ? plantFrames : walkFrames;
    if ((!moving && !planting) || frames.length < 2) {
      setFrameIndex(0);
      return;
    }
    const animationTimer = window.setInterval(() => setFrameIndex((current) => planting ? Math.min(current + 1, frames.length - 1) : (current + 1) % frames.length), planting ? 380 : 130);
    return () => window.clearInterval(animationTimer);
  }, [moving, planting, walkFrames, plantFrames]);

  useEffect(() => {
    if (!command) return;
    const activeCommand = command;
    let cancelled = false;
    const wait = (durationMs: number) => new Promise<void>((resolve) => window.setTimeout(resolve, durationMs));

    async function runCommand() {
      busyRef.current = true;
      const positionConfig = PLANT_ACTION_POSITIONS[activeCommand.target.rowIndex]?.[activeCommand.target.slotIndex];
      const plantSide = positionConfig && positionRef.current.x > positionConfig.seedX ? "right" : "left";
      const workPosition = positionConfig?.[plantSide] ?? { x: 50, y: 52 };

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
      setFacing(plantSide === "left" ? "right" : "left");
      setFrameIndex(0);
      setPlanting(true);
      await wait(1520);
      if (cancelled) return;
      await activeCommand.perform();
      await wait(1000);
      if (cancelled) return;
      setPlanting(false);
      busyRef.current = false;
      onCommandComplete(activeCommand.id);
    }

    void runCommand();
    return () => { cancelled = true; };
  }, [command, moveTo, onCommandComplete]);

  useEffect(() => () => {
    if (movementTimer.current !== null) window.clearTimeout(movementTimer.current);
  }, []);

  return (
    <div
      className={`garden-farmer-hamster ${moving ? "garden-farmer-hamster--moving" : planting ? "garden-farmer-hamster--planting" : "garden-farmer-hamster--idle"}`}
      style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: 10 + Math.round(position.y), transitionDuration: `${movementDuration}ms` }}
      aria-hidden="true"
    >
      <img src={planting ? plantFrames[frameIndex] ?? farmerIdle : moving ? walkFrames[frameIndex] ?? farmerIdle : farmerIdle} alt="" style={{ transform: facing === "left" ? "scaleX(-1)" : undefined }} />
    </div>
  );
}
