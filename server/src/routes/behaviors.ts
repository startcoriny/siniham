// 행동 도감 - 새 행동 발견 기록
import { Router } from "express";
import { z } from "zod";
import { BEHAVIOR_INFO } from "@shared/types/behavior";
import type { HamsterBehavior } from "@shared/types/hamster";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { serializeState } from "../lib/gameState";

export const behaviorsRouter = Router();

const paramsSchema = z.object({
  behaviorId: z.enum(Object.keys(BEHAVIOR_INFO) as [HamsterBehavior, ...HamsterBehavior[]]),
});

behaviorsRouter.post("/:behaviorId/discover", requireAuth, async (req, res) => {
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "요청 형식이 올바르지 않습니다." });
    return;
  }
  const userId = req.userId!;
  const { behaviorId } = parsed.data;

  const existing = await prisma.behaviorLog.findUnique({
    where: { userId_behaviorType: { userId, behaviorType: behaviorId } },
  });

  if (!existing) {
    await prisma.behaviorLog.create({ data: { userId, behaviorType: behaviorId } });
  }

  res.status(200).json(await serializeState(userId));
});
