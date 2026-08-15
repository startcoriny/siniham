// 정원 - 심기 / 잡초 제거 / 수확
import { Router } from "express";
import { z } from "zod";
import { CROP_IDS, CROP_MASTERS } from "@shared/types/garden";
import type { CropId } from "@shared/types/garden";
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

// 잡초 뽑기 동작을 전체 밭에서 확인하기 위한 임시 테스트 설정.
gardenRouter.post("/weeds/test-fill", requireAuth, async (req, res) => {
  const userId = req.userId!;
  await prisma.gardenPlot.updateMany({
    where: { userId },
    data: { hasWeed: true },
  });
  res.status(200).json(await serializeState(userId));
});
const cropSchema = z.object({ cropId: z.enum(CROP_IDS as [CropId, ...CropId[]]) });

gardenRouter.post("/seeds/purchase", requireAuth, async (req, res) => {
  const parsed = cropSchema.extend({ quantity: z.number().int().min(1).max(20).default(1) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "씨앗 구매 요청이 올바르지 않습니다." }); return; }
  const userId = req.userId!;
  const { cropId, quantity } = parsed.data;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const cost = CROP_MASTERS[cropId].seedCost * quantity;
  if (user.currency < cost) { res.status(400).json({ error: "재화가 조금 부족해요." }); return; }
  const inventory = user.seedInventory as Record<CropId, number>;
  inventory[cropId] = (inventory[cropId] ?? 0) + quantity;
  await prisma.user.update({ where: { id: userId }, data: { currency: { decrement: cost }, seedInventory: inventory, ...(cropId === "CARROT" ? { seedCount: inventory.CARROT } : {}) } });
  res.status(200).json(await serializeState(userId));
});

gardenRouter.post("/produce/eat", requireAuth, async (req, res) => {
  const parsed = cropSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "먹기 요청이 올바르지 않습니다." }); return; }
  const userId = req.userId!;
  const { cropId } = parsed.data;
  const [user, hamster] = await Promise.all([prisma.user.findUniqueOrThrow({ where: { id: userId } }), prisma.hamster.findUnique({ where: { userId } })]);
  if (!hamster) { res.status(400).json({ error: "먼저 햄스터를 만나 주세요." }); return; }
  const inventory = user.produceInventory as Record<CropId, number>;
  if ((inventory[cropId] ?? 0) < 1) { res.status(400).json({ error: "먹일 수확물이 없어요." }); return; }
  inventory[cropId]--;
  const crop = CROP_MASTERS[cropId];
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { produceInventory: inventory } }),
    prisma.hamster.update({ where: { id: hamster.id }, data: { hunger: Math.min(100, hamster.hunger + crop.hungerEffect), mood: Math.min(100, hamster.mood + crop.moodEffect) } }),
  ]);
  res.status(200).json(await serializeState(userId));
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
  const cropParsed = cropSchema.safeParse(req.body);
  if (!cropParsed.success) { res.status(400).json({ error: "심을 씨앗을 선택해 주세요." }); return; }
  const { cropId } = cropParsed.data;

  const [plot, user] = await Promise.all([
    getPlotOr404(userId, plotIndex),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);

  if (!plot || plot.status !== "EMPTY") {
    res.status(400).json({ error: "심을 수 있는 밭이 아니에요." });
    return;
  }
  const inventory = user.seedInventory as Record<CropId, number>;
  if ((inventory[cropId] ?? 0) < 1) {
    res.status(400).json({ error: "심을 수 있는 씨앗이 없어요. 상점에서 씨앗을 구매해 주세요." });
    return;
  }
  inventory[cropId]--;

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { seedInventory: inventory, ...(cropId === "CARROT" ? { seedCount: inventory.CARROT } : {}) } }),
    prisma.gardenPlot.update({
      where: { id: plot.id },
      data: { cropId, status: "GROWING", plantedAt: new Date(), hasWeed: false, weedFrom: new Date() },
    }),
  ]);
  await incrementGardenMission(userId);

  res.status(200).json(await serializeState(userId));
});

gardenRouter.delete("/:plotIndex", requireAuth, async (req, res) => {
  const parsed = plotParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "밭 번호가 올바르지 않습니다." });
    return;
  }
  const userId = req.userId!;
  const plot = await getPlotOr404(userId, parsed.data.plotIndex);
  if (!plot || plot.status === "EMPTY") {
    res.status(400).json({ error: "이미 비어 있는 밭이에요." });
    return;
  }
  await prisma.gardenPlot.update({
    where: { id: plot.id },
    data: { cropId: null, status: "EMPTY", hasWeed: false, plantedAt: null, weedFrom: null },
  });
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
    prisma.user.update({ where: { id: userId }, data: { currency: { increment: 1 } } }),
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

  if (!plot.cropId) { res.status(400).json({ error: "수확할 작물 정보가 없어요." }); return; }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const inventory = user.produceInventory as Record<CropId, number>;
  inventory[plot.cropId] = (inventory[plot.cropId] ?? 0) + CROP_MASTERS[plot.cropId].yield;
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { produceInventory: inventory } }),
    prisma.gardenPlot.update({
      where: { id: plot.id },
      data: { cropId: null, status: "EMPTY", hasWeed: false, plantedAt: null, weedFrom: null },
    }),
  ]);

  res.status(200).json(await serializeState(userId));
});
