// 회원가입/로그인/로그아웃/내 정보 조회 라우트
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { AuthResponse, AuthUser } from "@shared/types/auth";
import { prisma } from "../lib/prisma";
import { AUTH_COOKIE_NAME, signToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";
import { initializeStarterData } from "../lib/gameState";

export const authRouter = Router();

const credentialsSchema = z.object({
  nickname: z.string().min(1).max(20),
  password: z.string().min(4),
});

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: import("express").Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

function toAuthUser(user: { id: string; nickname: string; currency: number }): AuthUser {
  return { id: user.id, nickname: user.nickname, currency: user.currency };
}

authRouter.post("/signup", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "닉네임 또는 비밀번호 형식이 올바르지 않습니다." });
    return;
  }
  const { nickname, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { nickname } });
  if (existing) {
    res.status(409).json({ error: "이미 사용 중인 닉네임입니다." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { nickname, passwordHash } });
  await initializeStarterData(user.id);

  const token = signToken({ userId: user.id });
  setAuthCookie(res, token);

  const body: AuthResponse = { user: toAuthUser(user) };
  res.status(201).json(body);
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "닉네임 또는 비밀번호 형식이 올바르지 않습니다." });
    return;
  }
  const { nickname, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { nickname } });
  const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !isValid) {
    res.status(401).json({ error: "닉네임 또는 비밀번호가 일치하지 않습니다." });
    return;
  }

  // lastActiveAt은 여기서 갱신하지 않는다. 갱신해버리면 자리를 비운 간격이 사라져서
  // 로그인 직후 첫 /api/state가 오프라인 진행(햄스터 상태 감소, 정원 소식)을 계산하지 못한다.
  const token = signToken({ userId: user.id });
  setAuthCookie(res, token);

  const body: AuthResponse = { user: toAuthUser(user) };
  res.status(200).json(body);
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.status(204).send();
});

// 회원 탈퇴. 연관 테이블(Hamster/CageItem/GardenPlot/Mission/BehaviorLog)은 onDelete: Cascade로 함께 지워진다.
authRouter.delete("/me", requireAuth, async (req, res) => {
  const deleted = await prisma.user.deleteMany({ where: { id: req.userId } });
  if (deleted.count === 0) {
    res.status(401).json({ error: "인증이 필요합니다." });
    return;
  }

  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(401).json({ error: "인증이 필요합니다." });
    return;
  }

  const body: AuthResponse = { user: toAuthUser(user) };
  res.status(200).json(body);
});
