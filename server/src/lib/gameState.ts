// 회원가입 시 초기 데이터 생성 + 상태 조회(부트스트랩) + 정원 성장 lazy-tick
import { STARTER_ITEM_IDS } from "@shared/types/cage";
import { GARDEN_PLOT_COUNT } from "@shared/types/garden";
import { MISSIONS } from "@shared/types/mission";
import type { MissionId } from "@shared/types/mission";
import { prisma } from "./prisma";
import { calculateHamsterTick, koreaDateKey, MAX_OFFLINE_MS } from "./balance";

// 화면 설계서 6.5 초기 위치 예시(집: 왼쪽 뒤, 물통: 오른쪽 뒤, 먹이통: 오른쪽 앞)를 비율 좌표로 근사
const STARTER_ITEM_POSITIONS: Record<string, { posX: number; posY: number }> = {
  HOUSE: { posX: 0.2, posY: 0.3 },
  WATER_BOTTLE: { posX: 0.8, posY: 0.3 },
  FOOD_BOWL: { posX: 0.8, posY: 0.6 },
};

// product-plan.md에 정원 작물 성장 시간이 명시돼 있지 않아 임시로 정함. 확정되면 교체.
export const GROW_DURATION_MS = 10 * 60 * 1000;

export function todayKey(): string {
  return koreaDateKey();
}

export async function tickHamsterState(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const elapsedMs = Math.min(Date.now() - user.lastActiveAt.getTime(), MAX_OFFLINE_MS);
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

// 경과 시간이 충분한 GROWING 밭을 READY로 전환한다. 요청이 들어올 때마다 계산하는 lazy-tick.
export async function tickGardenGrowth(userId: string) {
  const now = Date.now();
  const growingPlots = await prisma.gardenPlot.findMany({
    where: { userId, status: "GROWING" },
  });

  const readyPlotIds = growingPlots
    .filter((plot) => plot.plantedAt && now - plot.plantedAt.getTime() >= GROW_DURATION_MS)
    .map((plot) => plot.id);

  if (readyPlotIds.length > 0) {
    await prisma.gardenPlot.updateMany({
      where: { id: { in: readyPlotIds } },
      data: { status: "READY" },
    });
  }
}

export async function serializeState(userId: string) {
  await initializeStarterData(userId);
  await Promise.all([ensureTodayMissions(userId), tickGardenGrowth(userId), tickHamsterState(userId)]);

  const [user, hamster, cageItems, gardenPlots, missions, behaviorLogs] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.hamster.findUnique({ where: { userId } }),
    prisma.cageItem.findMany({ where: { userId } }),
    prisma.gardenPlot.findMany({ where: { userId }, orderBy: { plotIndex: "asc" } }),
    prisma.mission.findMany({ where: { userId, missionDate: todayKey() } }),
    prisma.behaviorLog.findMany({ where: { userId } }),
  ]);

  return {
    currency: user.currency,
    seedCount: user.seedCount,
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
