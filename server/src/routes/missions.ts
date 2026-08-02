// 일일 미션 보상 수령
import { Router } from "express";
import { z } from "zod";
import { MISSIONS } from "@shared/types/mission";
import type { MissionId } from "@shared/types/mission";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { serializeState, todayKey } from "../lib/gameState";

export const missionsRouter = Router();

const paramsSchema = z.object({
  missionId: z.enum(Object.keys(MISSIONS) as [MissionId, ...MissionId[]]),
});

missionsRouter.post("/:missionId/claim", requireAuth, async (req, res) => {
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "요청 형식이 올바르지 않습니다." });
    return;
  }
  const userId = req.userId!;
  const { missionId } = parsed.data;
  const missionDate = todayKey();

  const mission = await prisma.mission.findUnique({
    where: { userId_missionType_missionDate: { userId, missionType: missionId, missionDate } },
  });

  if (!mission || mission.completedAt || mission.progress < mission.target) {
    res.status(400).json({ error: "아직 받을 수 없는 보상이에요." });
    return;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { currency: { increment: MISSIONS[missionId].reward } },
    }),
    prisma.mission.update({ where: { id: mission.id }, data: { completedAt: new Date() } }),
  ]);

  res.status(200).json(await serializeState(userId));
});
