// 상점 구매
import { Router } from "express";
import { z } from "zod";
import { ITEM_MASTERS } from "@shared/types/cage";
import type { ItemId } from "@shared/types/cage";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { pickFreeSlot, serializeState } from "../lib/gameState";

export const shopRouter = Router();

const purchaseSchema = z.object({
  itemId: z.enum(Object.keys(ITEM_MASTERS) as [ItemId, ...ItemId[]]),
});

shopRouter.post("/purchase", requireAuth, async (req, res) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "요청 형식이 올바르지 않습니다." });
    return;
  }
  const { itemId } = parsed.data;
  const item = ITEM_MASTERS[itemId];

  if (!item.purchasable) {
    res.status(400).json({ error: "구매할 수 없는 아이템입니다." });
    return;
  }

  const userId = req.userId!;
  const [user, owned, placed] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.cageItem.findUnique({
      where: { userId_itemMasterId: { userId, itemMasterId: itemId } },
    }),
    prisma.cageItem.findMany({ where: { userId }, select: { posX: true, posY: true } }),
  ]);

  if (owned) {
    res.status(409).json({ error: "이미 보유한 아이템입니다." });
    return;
  }
  if (user.currency < item.cost) {
    res.status(400).json({ error: "재화가 조금 부족해요. 미션이나 정원 활동으로 재화를 모아보세요." });
    return;
  }

  // 기본 좌표에 그대로 두면 여러 개를 살 때 케이지 한가운데 겹쳐 쌓인다.
  const slot = pickFreeSlot(placed);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { currency: { decrement: item.cost } } }),
    prisma.cageItem.create({ data: { userId, itemMasterId: itemId, ...slot } }),
  ]);

  res.status(200).json(await serializeState(userId));
});
