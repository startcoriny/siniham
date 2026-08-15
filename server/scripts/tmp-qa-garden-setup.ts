// 일회성 QA 데이터 스크립트. qa-preview 계정 정원을 지민과 동일하게 세팅해 스크린샷으로 확인한다.
import { prisma } from "../src/lib/prisma";
import { CROP_MASTERS } from "../../shared/types/garden";
import type { CropId } from "../../shared/types/garden";

const ROW_CROPS: CropId[] = ["CARROT", "STRAWBERRY", "TOMATO", "SUNFLOWER"];
const now = Date.now();

async function main() {
  const user = await prisma.user.findUniqueOrThrow({ where: { nickname: "qa-preview" } });

  for (let row = 0; row < 4; row++) {
    const cropId = ROW_CROPS[row];
    const growDurationMs = CROP_MASTERS[cropId].growDurationMs;

    // slot 0: 방금 심음 (새싹 단계)
    await prisma.gardenPlot.update({
      where: { userId_plotIndex: { userId: user.id, plotIndex: row * 4 + 0 } },
      data: { cropId, status: "GROWING", hasWeed: false, plantedAt: new Date(now), weedFrom: new Date(now) },
    });
    // slot 1: 절반 이상 자람 (성장중 단계, 잡초 없음)
    await prisma.gardenPlot.update({
      where: { userId_plotIndex: { userId: user.id, plotIndex: row * 4 + 1 } },
      data: {
        cropId,
        status: "GROWING",
        hasWeed: false,
        plantedAt: new Date(now - growDurationMs * 0.7),
        weedFrom: new Date(now - growDurationMs * 0.7),
      },
    });
    // slot 2: 절반 이상 자람 + 잡초
    await prisma.gardenPlot.update({
      where: { userId_plotIndex: { userId: user.id, plotIndex: row * 4 + 2 } },
      data: {
        cropId,
        status: "GROWING",
        hasWeed: true,
        plantedAt: new Date(now - growDurationMs * 0.7),
        weedFrom: new Date(now - 6 * 60_000),
      },
    });
    await prisma.gardenPlot.update({
      where: { userId_plotIndex: { userId: user.id, plotIndex: row * 4 + 3 } },
      data: { cropId, status: "READY", hasWeed: false, plantedAt: new Date(now - growDurationMs), weedFrom: null },
    });
  }

  console.log("done");
}

main().finally(() => prisma.$disconnect());
