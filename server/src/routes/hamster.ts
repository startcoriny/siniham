// 햄스터 온보딩, 돌보기 액션, 케이지 가구 배치를 처리한다.
import { Router } from "express";
import { z } from "zod";
import type { HamsterAction, HamsterBehavior } from "@shared/types/hamster";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { ensureTodayMissions, serializeState, todayKey } from "../lib/gameState";

export const hamsterRouter = Router();

const createSchema = z.object({
  name: z.string().trim().min(1).max(12),
  appearance: z.enum(["GOLDEN", "GRAY"]),
});

const actionSchema = z.object({ action: z.enum(["FEED", "WATER", "PET", "CLEAN"]) });
const positionSchema = z.object({
  posX: z.number().min(0.08).max(0.92),
  posY: z.number().min(0.15).max(0.85),
});
const itemParamsSchema = z.object({ itemId: z.string().min(1) });

const actionInfo: Record<
  HamsterAction,
  { mission?: "FEED" | "WATER" | "PET"; behavior: HamsterBehavior }
> = {
  FEED: { mission: "FEED", behavior: "EAT" },
  WATER: { mission: "WATER", behavior: "DRINK" },
  PET: {
    mission: "PET",
    behavior: "PET",
  },
  CLEAN: { behavior: "WASH" },
};

hamsterRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "햄스터 이름과 외형을 확인해 주세요." });
    return;
  }
  const userId = req.userId!;
  const existing = await prisma.hamster.findUnique({ where: { userId } });
  if (existing) {
    res.status(409).json({ error: "이미 함께 지내는 햄스터가 있어요." });
    return;
  }
  await prisma.hamster.create({ data: { userId, ...parsed.data } });
  res.status(201).json(await serializeState(userId));
});

hamsterRouter.post("/action", requireAuth, async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "알 수 없는 돌보기 행동이에요." });
    return;
  }
  const userId = req.userId!;
  const info = actionInfo[parsed.data.action];
  await ensureTodayMissions(userId);
  const hamster = await prisma.hamster.findUnique({ where: { userId } });
  if (!hamster) {
    res.status(409).json({ error: "먼저 햄스터를 만나 주세요." });
    return;
  }

  await prisma.$transaction(async (tx) => {
    const stats =
      parsed.data.action === "FEED" ? { hunger: Math.min(100, hamster.hunger + 30) }
      : parsed.data.action === "WATER" ? { thirst: Math.min(100, hamster.thirst + 30) }
      : parsed.data.action === "PET" ? {
          mood: Math.min(100, hamster.mood + 10),
          intimacy: Math.min(100, hamster.intimacy + 5),
        }
      : { cleanliness: Math.min(100, hamster.cleanliness + 20) };
    await tx.hamster.update({ where: { id: hamster.id }, data: { ...stats, state: "IDLE" } });
    if (info.mission) {
      const mission = await tx.mission.findUnique({
        where: {
          userId_missionType_missionDate: {
            userId,
            missionType: info.mission,
            missionDate: todayKey(),
          },
        },
      });
      if (mission && mission.progress < mission.target) {
        await tx.mission.update({ where: { id: mission.id }, data: { progress: { increment: 1 } } });
      }
    }
    await tx.behaviorLog.upsert({
      where: { userId_behaviorType: { userId, behaviorType: info.behavior } },
      update: {},
      create: { userId, behaviorType: info.behavior },
    });
  });
  res.status(200).json(await serializeState(userId));
});

hamsterRouter.patch("/cage-items/:itemId", requireAuth, async (req, res) => {
  const parsed = positionSchema.safeParse(req.body);
  const params = itemParamsSchema.safeParse(req.params);
  if (!parsed.success || !params.success) {
    res.status(400).json({ error: "가구를 놓을 수 있는 범위를 벗어났어요." });
    return;
  }
  const item = await prisma.cageItem.findFirst({ where: { id: params.data.itemId, userId: req.userId! } });
  if (!item) {
    res.status(404).json({ error: "보유하지 않은 가구예요." });
    return;
  }
  await prisma.cageItem.update({ where: { id: item.id }, data: parsed.data });
  res.status(200).json(await serializeState(req.userId!));
});
