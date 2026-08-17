// 일회성 QA 데이터 스크립트. qa-preview 계정 정원을 지민과 동일하게 세팅해 스크린샷으로 확인한다.
import { prisma } from "../src/lib/prisma";
import { CROP_MASTERS } from "../../shared/types/garden";
const now = Date.now();

async function main() {
  const user = await prisma.user.findFirstOrThrow({ orderBy: { lastActiveAt: "desc" } });
  const result = await prisma.gardenPlot.updateMany({
    where: { userId: user.id },
    data: {
      cropId: "CARROT",
      status: "READY",
      hasWeed: false,
      plantedAt: new Date(now - CROP_MASTERS.CARROT.growDurationMs),
      weedFrom: null,
      lastWateredAt: null,
      lastWateredEffectAt: null,
      waterBoostCount: 0,
    },
  });

  console.log(`${user.nickname}: 당근 READY ${result.count}칸`);
}

main().finally(() => prisma.$disconnect());
