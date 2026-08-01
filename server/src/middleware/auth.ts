// 쿠키의 JWT를 검증해 req.userId를 채우는 인증 미들웨어
import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME, verifyToken } from "../lib/jwt";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[AUTH_COOKIE_NAME];
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    res.status(401).json({ error: "인증이 필요합니다." });
    return;
  }

  req.userId = payload.userId;
  next();
}
