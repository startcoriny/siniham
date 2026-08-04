// 햄스터 온보딩, 돌보기 액션, 케이지 가구 배치를 처리한다.
import { Router } from "express";
import { z } from "zod";
import type { HamsterAction, HamsterBehavior, IdleActivityItemId } from "@shared/types/hamster";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { ensureTodayMissions, serializeState, todayKey } from "../lib/gameState";

export const hamsterRouter = Router();

const createSchema = z.object({
  name: z.string().trim().min(1).max(12),
  appearance: z.enum(["GOLDEN", "GRAY"]),
});

const actionSchema = z.object({ action: z.enum(["FEED", "WATER", "PET", "WASH"]) });
const idleActivitySchema = z.object({
  itemId: z.enum(["WHEEL", "HOUSE", "SAND_BATH", "SNACK_DISH", "LOOKOUT"]),
});
// 배경이 유리벽+바닥 그림으로 바뀌면서 바닥은 posY 0.35부터다. 그 위는 유리벽이라
// 가구를 놓으면 허공에 떠 보인다.
const positionSchema = z.object({
  posX: z.number().min(0.08).max(0.92),
  posY: z.number().min(0.35).max(0.85),
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
  WASH: { behavior: "WASH" },
};

// 가구별 자율 행동 효과. 사용자가 시키는 돌보기보다 회복량을 작게 둬서 버튼을 대체하지 않게 한다.
const IDLE_ACTIVITY: Record<
  IdleActivityItemId,
  { behavior: HamsterBehavior; mood?: number; cleanliness?: number; stamina?: number }
> = {
  WHEEL: { behavior: "WHEEL", mood: 6, stamina: -8 },
  HOUSE: { behavior: "SLEEP", stamina: 8 },
  SAND_BATH: { behavior: "WASH", cleanliness: 8 },
  SNACK_DISH: { behavior: "CHEEK", mood: 6 },
  LOOKOUT: { behavior: "LOOK", mood: 5 },
};

// 화면에 오래 머무는 것만으로 수치가 계속 오르지 않도록 쿨다운을 둔다.
const IDLE_ACTIVITY_COOLDOWN_MS = 20_000;

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
      : { cleanliness: Math.min(100, hamster.cleanliness + 20) }; // WASH(세수하기)
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

// 케이지를 보는 동안 햄스터가 스스로 가구를 쓰는 행동. 화면 연출이 끝난 시점에 클라이언트가 알린다.
hamsterRouter.post("/idle-activity", requireAuth, async (req, res) => {
  const parsed = idleActivitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "알 수 없는 자율 행동이에요." });
    return;
  }
  const userId = req.userId!;
  const { itemId } = parsed.data;

  const [hamster, owned] = await Promise.all([
    prisma.hamster.findUnique({ where: { userId } }),
    prisma.cageItem.findUnique({ where: { userId_itemMasterId: { userId, itemMasterId: itemId } } }),
  ]);
  if (!hamster) {
    res.status(409).json({ error: "먼저 햄스터를 만나 주세요." });
    return;
  }
  if (!owned) {
    res.status(400).json({ error: "케이지에 없는 가구예요." });
    return;
  }

  // 쿨다운 중이면 수치만 건드리지 않고 현재 상태를 그대로 돌려준다. 연출은 이미 끝났으므로 오류가 아니다.
  const onCooldown =
    hamster.lastIdleAt !== null &&
    Date.now() - hamster.lastIdleAt.getTime() < IDLE_ACTIVITY_COOLDOWN_MS;
  if (onCooldown) {
    res.status(200).json(await serializeState(userId));
    return;
  }

  const effect = IDLE_ACTIVITY[itemId];
  await prisma.$transaction(async (tx) => {
    await tx.hamster.update({
      where: { id: hamster.id },
      data: {
        mood: clampStat(hamster.mood + (effect.mood ?? 0)),
        cleanliness: clampStat(hamster.cleanliness + (effect.cleanliness ?? 0)),
        stamina: clampStat(hamster.stamina + (effect.stamina ?? 0)),
        lastIdleAt: new Date(),
      },
    });
    // 스스로 한 행동도 행동 도감에 남는다.
    await tx.behaviorLog.upsert({
      where: { userId_behaviorType: { userId, behaviorType: effect.behavior } },
      update: {},
      create: { userId, behaviorType: effect.behavior },
    });
  });

  res.status(200).json(await serializeState(userId));
});

function clampStat(value: number) {
  return Math.max(0, Math.min(100, value));
}

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
