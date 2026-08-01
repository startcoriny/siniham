// 회원가입/로그인/로그아웃/내 정보 조회 라우트
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { AuthResponse, AuthUser } from "@shared/types/auth";
import { prisma } from "../lib/prisma";
import { AUTH_COOKIE_NAME, signToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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

function toAuthUser(user: { id: string; email: string; currency: number }): AuthUser {
  return { id: user.id, email: user.email, currency: user.currency };
}

authRouter.post("/signup", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "이메일 또는 비밀번호 형식이 올바르지 않습니다." });
    return;
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "이미 가입된 이메일입니다." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  const token = signToken({ userId: user.id });
  setAuthCookie(res, token);

  const body: AuthResponse = { user: toAuthUser(user) };
  res.status(201).json(body);
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "이메일 또는 비밀번호 형식이 올바르지 않습니다." });
    return;
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !isValid) {
    res.status(401).json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." });
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

  const token = signToken({ userId: user.id });
  setAuthCookie(res, token);

  const body: AuthResponse = { user: toAuthUser(user) };
  res.status(200).json(body);
});

authRouter.post("/logout", (_req, res) => {
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
