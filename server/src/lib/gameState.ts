// 회원가입 시 초기 데이터 생성 + 상태 조회(부트스트랩) + 정원 성장 lazy-tick
import { STARTER_ITEM_IDS } from "@shared/types/cage";
import { GARDEN_PLOT_COUNT } from "@shared/types/garden";
import { MISSIONS } from "@shared/types/mission";
import type { MissionId } from "@shared/types/mission";
import { prisma } from "./prisma";
import {
  calculateHamsterTick,
  koreaDateKey,
  msUntilKoreaMidnight,
  shouldGrowWeed,
  MAX_OFFLINE_MS,
  OFFLINE_SUMMARY_THRESHOLD_MS,
} from "./balance";

// 화면 설계서 6.5 초기 위치 예시(집: 왼쪽 뒤, 물통: 오른쪽 뒤, 먹이통: 오른쪽 앞)를 비율 좌표로 근사
const STARTER_ITEM_POSITIONS: Record<string, { posX: number; posY: number }> = {
  HOUSE: { posX: 0.2, posY: 0.3 },
  WATER_BOTTLE: { posX: 0.8, posY: 0.3 },
  FOOD_BOWL: { posX: 0.8, posY: 0.6 },
};

// 구매한 가구를 놓을 후보 자리. 순서대로 비어 있는 곳에 놓아 기본 좌표(0.5, 0.5)에 겹치지 않게 한다.
const PURCHASE_SLOTS: Array<{ posX: number; posY: number }> = [
  { posX: 0.35, posY: 0.62 },
  { posX: 0.62, posY: 0.62 },
  { posX: 0.2, posY: 0.75 },
  { posX: 0.5, posY: 0.8 },
  { posX: 0.78, posY: 0.78 },
  { posX: 0.45, posY: 0.35 },
];
// 두 가구가 이 거리 안에 있으면 겹쳐 보인다고 판단한다.
const SLOT_MIN_DISTANCE = 0.12;

// 이미 놓인 가구와 겹치지 않는 첫 자리를 고른다. 남는 자리가 없으면 마지막 후보를 쓴다.
export function pickFreeSlot(placed: Array<{ posX: number; posY: number }>) {
  for (const slot of PURCHASE_SLOTS) {
    const collides = placed.some(
      (item) =>
        Math.abs(item.posX - slot.posX) < SLOT_MIN_DISTANCE &&
        Math.abs(item.posY - slot.posY) < SLOT_MIN_DISTANCE,
    );
    if (!collides) return slot;
  }
  return PURCHASE_SLOTS[PURCHASE_SLOTS.length - 1];
}

// product-plan.md에 정원 작물 성장 시간이 명시돼 있지 않아 임시로 정함. 확정되면 교체.
export const GROW_DURATION_MS = 10 * 60 * 1000;

export function todayKey(): string {
  return koreaDateKey();
}

export async function tickHamsterState(userId: string, elapsedMs: number) {
  if (elapsedMs < 60_000) return;
  const hamster = await prisma.hamster.findUnique({ where: { userId } });
  if (hamster) {
    const next = calculateHamsterTick(hamster, elapsedMs);
    await prisma.hamster.update({
      where: { id: hamster.id },
      data: {
        hunger: next.hunger,
        thirst: next.thirst,
        cleanliness: next.cleanliness,
        mood: next.mood,
        stamina: next.stamina,
        state: next.shouldSleep ? "SLEEPING" : hamster.state,
      },
    });
  }
  await prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } });
}

export async function initializeStarterData(userId: string) {
  await prisma.cageItem.createMany({
    data: STARTER_ITEM_IDS.map((itemId) => ({
      userId,
      itemMasterId: itemId,
      ...STARTER_ITEM_POSITIONS[itemId],
    })),
    skipDuplicates: true,
  });

  await prisma.gardenPlot.createMany({
    data: Array.from({ length: GARDEN_PLOT_COUNT }, (_, plotIndex) => ({ userId, plotIndex })),
    skipDuplicates: true,
  });
}

export async function ensureTodayMissions(userId: string) {
  const missionDate = todayKey();
  const missionIds = Object.keys(MISSIONS) as MissionId[];

  for (const missionType of missionIds) {
    await prisma.mission.upsert({
      where: { userId_missionType_missionDate: { userId, missionType, missionDate } },
      update: {},
      create: {
        userId,
        missionType,
        missionDate,
        target: MISSIONS[missionType].target,
      },
    });
  }
}

// GROWING 밭의 성장 완료와 잡초 생성을 함께 처리한다. 요청이 들어올 때마다 계산하는 lazy-tick.
// 반환값은 이번 tick에서 실제로 바뀐 밭 수라 "정원 소식" 요약의 원본이 된다.
export async function tickGardenGrowth(userId: string): Promise<{ grown: number; weeded: number }> {
  const now = Date.now();
  const growingPlots = await prisma.gardenPlot.findMany({
    where: { userId, status: "GROWING" },
  });

  const readyPlotIds: string[] = [];
  const weedPlotIds: string[] = [];

  for (const plot of growingPlots) {
    if (plot.plantedAt && now - plot.plantedAt.getTime() >= GROW_DURATION_MS) {
      // 다 자란 밭에는 잡초를 새로 만들지 않는다. 수확만 하면 되는 상태로 둔다.
      readyPlotIds.push(plot.id);
      continue;
    }
    if (!plot.hasWeed && shouldGrowWeed(plot.weedFrom, now)) {
      weedPlotIds.push(plot.id);
    }
  }

  if (readyPlotIds.length > 0) {
    await prisma.gardenPlot.updateMany({
      where: { id: { in: readyPlotIds } },
      data: { status: "READY" },
    });
  }
  if (weedPlotIds.length > 0) {
    await prisma.gardenPlot.updateMany({
      where: { id: { in: weedPlotIds } },
      data: { hasWeed: true },
    });
  }

  return { grown: readyPlotIds.length, weeded: weedPlotIds.length };
}

// 자리를 비운 사이 정원에 생긴 변화를 User에 쌓아둔다. 화면에서 "정원 소식"을 확인하면 비운다.
async function accumulateGardenSummary(
  userId: string,
  lastActiveAt: Date,
  pendingSummaryFrom: Date | null,
  changes: { grown: number; weeded: number },
) {
  if (changes.grown === 0 && changes.weeded === 0) return;
  await prisma.user.update({
    where: { id: userId },
    data: {
      pendingGrownCount: { increment: changes.grown },
      pendingWeedCount: { increment: changes.weeded },
      pendingSummaryFrom: pendingSummaryFrom ?? lastActiveAt,
    },
  });
}

export async function serializeState(userId: string) {
  await initializeStarterData(userId);

  const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const offlineMs = Math.min(Date.now() - before.lastActiveAt.getTime(), MAX_OFFLINE_MS);

  await ensureTodayMissions(userId);
  const gardenChanges = await tickGardenGrowth(userId);
  // 화면을 보고 있는 동안 일어난 변화까지 모달로 알리면 흐름을 끊으므로, 자리를 비웠을 때만 모은다.
  if (offlineMs >= OFFLINE_SUMMARY_THRESHOLD_MS) {
    await accumulateGardenSummary(userId, before.lastActiveAt, before.pendingSummaryFrom, gardenChanges);
  }
  await tickHamsterState(userId, offlineMs);

  const [user, hamster, cageItems, gardenPlots, missions, behaviorLogs] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.hamster.findUnique({ where: { userId } }),
    prisma.cageItem.findMany({ where: { userId } }),
    prisma.gardenPlot.findMany({ where: { userId }, orderBy: { plotIndex: "asc" } }),
    prisma.mission.findMany({ where: { userId, missionDate: todayKey() } }),
    prisma.behaviorLog.findMany({ where: { userId } }),
  ]);

  const hasGardenSummary = user.pendingGrownCount > 0 || user.pendingWeedCount > 0;

  return {
    currency: user.currency,
    seedCount: user.seedCount,
    // 미션 탭의 "자정까지 남은 시간"이 서버의 일일 리셋 기준과 어긋나지 않도록 함께 내려준다.
    missionResetInMs: msUntilKoreaMidnight(),
    gardenSummary: hasGardenSummary
      ? {
          grownCount: user.pendingGrownCount,
          weedCount: user.pendingWeedCount,
          since: user.pendingSummaryFrom ? user.pendingSummaryFrom.toISOString() : null,
        }
      : null,
    ownedItemIds: cageItems.map((item) => item.itemMasterId),
    gardenPlots: gardenPlots.map((plot) => ({
      id: plot.plotIndex,
      status: plot.status,
      hasWeed: plot.hasWeed,
      plantedAt: plot.plantedAt ? plot.plantedAt.getTime() : null,
    })),
    missionProgress: Object.fromEntries(
      missions.map((m) => [m.missionType, { progress: m.progress, claimed: m.completedAt !== null }]),
    ),
    discoveredBehaviors: Object.fromEntries(
      behaviorLogs.map((b) => [b.behaviorType, b.firstDiscoveredAt.toISOString().slice(0, 10)]),
    ),
    cageItems: cageItems.map((item) => ({
      id: item.id,
      itemId: item.itemMasterId,
      posX: item.posX,
      posY: item.posY,
    })),
    hamster: hamster
      ? {
          id: hamster.id,
          name: hamster.name,
          appearance: hamster.appearance,
          personality: hamster.personality,
          stats: {
            hunger: hamster.hunger,
            thirst: hamster.thirst,
            cleanliness: hamster.cleanliness,
            mood: hamster.mood,
            stamina: hamster.stamina,
            intimacy: hamster.intimacy,
          },
          growthStage: hamster.growthStage,
          state: hamster.state,
          createdAt: hamster.createdAt.toISOString(),
        }
      : null,
  };
}
