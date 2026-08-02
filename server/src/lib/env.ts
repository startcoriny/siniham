// 서버 시작에 필요한 환경변수를 한 번에 검증한다.
const required = ["DATABASE_URL", "JWT_SECRET"] as const;

for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} 환경변수가 설정되지 않았습니다.`);
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
};
