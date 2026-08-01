// JWT 발급/검증 유틸 (httpOnly 쿠키에 담을 토큰)
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
  }
  return secret;
}

const TOKEN_TTL = "7d";

export const AUTH_COOKIE_NAME = "siniham_token";

export interface TokenPayload {
  userId: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as unknown as TokenPayload;
  } catch {
    return null;
  }
}
