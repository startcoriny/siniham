-- AlterTable
ALTER TABLE "GardenPlot" ADD COLUMN     "weedFrom" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pendingGrownCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pendingSummaryFrom" TIMESTAMP(3),
ADD COLUMN     "pendingWeedCount" INTEGER NOT NULL DEFAULT 0;

-- 이미 자라고 있던 밭은 심은 시각을 잡초 계산 기준으로 삼는다. 없으면 잡초가 영영 생기지 않는다.
UPDATE "GardenPlot" SET "weedFrom" = "plantedAt" WHERE "status" = 'GROWING' AND "plantedAt" IS NOT NULL;
