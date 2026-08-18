// Express 앱 진입점
import "dotenv/config";
import express from "express";
import path from "node:path";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { stateRouter } from "./routes/state";
import { shopRouter } from "./routes/shop";
import { gardenRouter } from "./routes/garden";
import { missionsRouter } from "./routes/missions";
import { behaviorsRouter } from "./routes/behaviors";
import { hamsterRouter } from "./routes/hamster";
import { seedItemMasters } from "./lib/seedItemMasters";
import { apiLimiter } from "./middleware/rateLimit";
import { env } from "./lib/env";

const app = express();

// 운영에서는 리버스 프록시(HTTPS 종단) 뒤에 선다. 이 설정이 없으면 모든 요청의 IP가
// 프록시 주소로 보여서 요청 제한이 전체 사용자에게 한꺼번에 걸린다. 바로 앞의 프록시 한 대만 신뢰한다.
if (env.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRouter);
app.use("/api/state", stateRouter);
app.use("/api/shop", shopRouter);
app.use("/api/garden", gardenRouter);
app.use("/api/missions", missionsRouter);
app.use("/api/behaviors", behaviorsRouter);
app.use("/api/hamster", hamsterRouter);

app.use("/api", (_req, res) => res.status(404).json({ error: "요청한 API를 찾을 수 없습니다." }));

if (env.nodeEnv === "production") {
  const clientDist = path.resolve(process.cwd(), "client/dist");
  app.use(express.static(clientDist));
  app.use((_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "서버에서 요청을 처리하지 못했습니다." });
});

seedItemMasters()
  .catch((err) => console.error("ItemMaster 시드 실패", err))
  .finally(() => {
    app.listen(env.port, () => {
      console.log(`server listening on :${env.port}`);
    });
  });
