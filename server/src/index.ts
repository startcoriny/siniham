// Express 앱 진입점
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { stateRouter } from "./routes/state";
import { shopRouter } from "./routes/shop";
import { gardenRouter } from "./routes/garden";
import { missionsRouter } from "./routes/missions";
import { behaviorsRouter } from "./routes/behaviors";
import { seedItemMasters } from "./lib/seedItemMasters";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/state", stateRouter);
app.use("/api/shop", shopRouter);
app.use("/api/garden", gardenRouter);
app.use("/api/missions", missionsRouter);
app.use("/api/behaviors", behaviorsRouter);

const PORT = Number(process.env.PORT ?? 3000);

seedItemMasters()
  .catch((err) => console.error("ItemMaster 시드 실패", err))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`server listening on :${PORT}`);
    });
  });
