// 현재 사용자의 재화/보유아이템/정원/미션/도감 상태를 한번에 반환
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { serializeState } from "../lib/gameState";

export const stateRouter = Router();

stateRouter.get("/", requireAuth, async (req, res) => {
  const state = await serializeState(req.userId!);
  res.status(200).json(state);
});
