-- CreateEnum
CREATE TYPE "ItemId" AS ENUM ('FOOD_BOWL', 'WATER_BOTTLE', 'HOUSE', 'WHEEL', 'TUNNEL');

-- CreateEnum
CREATE TYPE "PlotStatus" AS ENUM ('EMPTY', 'GROWING', 'READY');

-- CreateEnum
CREATE TYPE "MissionId" AS ENUM ('FEED', 'WATER', 'PET', 'GARDEN');

-- CreateEnum
CREATE TYPE "HamsterBehavior" AS ENUM ('IDLE', 'WALK', 'LOOK', 'EAT', 'DRINK', 'SLEEP', 'WHEEL', 'PET', 'WASH', 'CHEEK', 'USER_LOOK', 'GARDEN');

-- CreateTable
CREATE TABLE "ItemMaster" (
    "id" "ItemId" NOT NULL,
    "name" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "purchasable" BOOLEAN NOT NULL DEFAULT true,
    "effectJson" JSONB,

    CONSTRAINT "ItemMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CageItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemMasterId" "ItemId" NOT NULL,
    "posX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "posY" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GardenPlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plotIndex" INTEGER NOT NULL,
    "status" "PlotStatus" NOT NULL DEFAULT 'EMPTY',
    "hasWeed" BOOLEAN NOT NULL DEFAULT false,
    "plantedAt" TIMESTAMP(3),

    CONSTRAINT "GardenPlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionType" "MissionId" NOT NULL,
    "missionDate" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "behaviorType" "HamsterBehavior" NOT NULL,
    "firstDiscoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehaviorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CageItem_userId_itemMasterId_key" ON "CageItem"("userId", "itemMasterId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenPlot_userId_plotIndex_key" ON "GardenPlot"("userId", "plotIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_userId_missionType_missionDate_key" ON "Mission"("userId", "missionType", "missionDate");

-- CreateIndex
CREATE UNIQUE INDEX "BehaviorLog_userId_behaviorType_key" ON "BehaviorLog"("userId", "behaviorType");

-- AddForeignKey
ALTER TABLE "CageItem" ADD CONSTRAINT "CageItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CageItem" ADD CONSTRAINT "CageItem_itemMasterId_fkey" FOREIGN KEY ("itemMasterId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenPlot" ADD CONSTRAINT "GardenPlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorLog" ADD CONSTRAINT "BehaviorLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
