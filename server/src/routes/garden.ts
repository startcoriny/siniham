// 정원 - 심기 / 잡초 제거 / 수확
import { Router } from "express";
import { z } from "zod";
import { HARVEST_REWARD } from "@shared/types/garden";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { ensureTodayMissions, serializeState, tickGardenGrowth, todayKey } from "../lib/gameState";

async function incrementGardenMission(userId: string) {
  await ensureTodayMissions(userId);
  const mission = await prisma.mission.findUnique({
    where: {
      userId_missionType_missionDate: { userId, missionType: "GARDEN", missionDate: todayKey() },
    },
  });
  if (mission && mission.progress < mission.target) {
    await prisma.mission.update({ where: { id: mission.id }, data: { progress: { increment: 1 } } });
  }
  await prisma.behaviorLog.upsert({
    where: { userId_behaviorType: { userId, behaviorType: "GARDEN" } },
    update: {},
    create: { userId, behaviorType: "GARDEN" },
  });
}

export const gardenRouter = Router();

// 밭 번호 경로(/:plotIndex/...)보다 먼저 등록해 "summary"가 밭 번호로 해석되지 않게 한다.
gardenRouter.post("/summary/ack", requireAuth, async (req, res) => {
  const userId = req.userId!;
  await prisma.user.update({
    where: { id: userId },
    data: { pendingGrownCount: 0, pendingWeedCount: 0, pendingSummaryFrom: null },
  });
  res.status(200).json(await serializeState(userId));
});

const plotParamsSchema = z.object({
  plotIndex: z.coerce.number().int().min(0),
});

async function getPlotOr404(userId: string, plotIndex: number) {
  return prisma.gardenPlot.findUnique({ where: { userId_plotIndex: { userId, plotIndex } } });
}

gardenRouter.post("/:plotIndex/plant", requireAuth, async (req, res) => {
  const parsed = plotParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "요청 형식이 올바르지 않습니다." });
    return;
  }
  const userId = req.userId!;
  const { plotIndex } = parsed.data;

  const [plot, user] = await Promise.all([
    getPlotOr404(userId, plotIndex),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);

  if (!plot || plot.status !== "EMPTY") {
    res.status(400).json({ error: "심을 수 있는 밭이 아니에요." });
    return;
  }
  if (user.seedCount < 1) {
    res.status(400).json({ error: "심을 수 있는 씨앗이 없어요. 잡초를 제거하면 씨앗을 얻을 수 있어요." });
    return;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { seedCount: { decrement: 1 } } }),
    prisma.gardenPlot.update({
      where: { id: plot.id },
      data: { status: "GROWING", plantedAt: new Date(), hasWeed: false, weedFrom: new Date() },
    }),
  ]);
  await incrementGardenMission(userId);

  res.status(200).json(await serializeState(userId));
});

gardenRouter.post("/:plotIndex/remove-weed", requireAuth, async (req, res) => {
  const parsed = plotParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "요청 형식이 올바르지 않습니다." });
    return;
  }
  const userId = req.userId!;
  const { plotIndex } = parsed.data;

  await tickGardenGrowth(userId);
  const plot = await getPlotOr404(userId, plotIndex);
  if (!plot || !plot.hasWeed) {
    res.status(400).json({ error: "제거할 잡초가 없어요." });
    return;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { seedCount: { increment: 1 } } }),
    // 뽑은 시점부터 다음 잡초까지의 시간을 다시 잰다.
    prisma.gardenPlot.update({ where: { id: plot.id }, data: { hasWeed: false, weedFrom: new Date() } }),
  ]);

  res.status(200).json(await serializeState(userId));
});

gardenRouter.post("/:plotIndex/harvest", requireAuth, async (req, res) => {
  const parsed = plotParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "요청 형식이 올바르지 않습니다." });
    return;
  }
  const userId = req.userId!;
  const { plotIndex } = parsed.data;

  await tickGardenGrowth(userId);
  const plot = await getPlotOr404(userId, plotIndex);
  if (!plot || plot.status !== "READY") {
    res.status(400).json({ error: "수확할 수 있는 밭이 아니에요." });
    return;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { currency: { increment: HARVEST_REWARD } } }),
    prisma.gardenPlot.update({
      where: { id: plot.id },
      data: { status: "EMPTY", hasWeed: false, plantedAt: null, weedFrom: null },
    }),
  ]);

  res.status(200).json(await serializeState(userId));
});
