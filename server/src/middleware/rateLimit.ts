// 로그인/회원가입 무차별 대입을 막는 요청 제한 미들웨어
import rateLimit from "express-rate-limit";

// 로그인은 닉네임 하나만 알면 비밀번호만 바꿔가며 시도할 수 있어 제한이 없으면 자동화로 뚫린다.
// 사람이 오타로 몇 번 틀리는 것은 막지 않되, 초당 수십 건씩 던지는 시도는 끊는다.
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "시도가 너무 잦아요. 잠시 후 다시 시도해 주세요." },
});

// 그 외 API 전반의 안전장치. 정상 플레이는 이 한도에 걸리지 않는다.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요." },
});
