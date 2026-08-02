-- CreateEnum
CREATE TYPE "HamsterAppearance" AS ENUM ('GOLDEN', 'GRAY');

-- CreateEnum
CREATE TYPE "HamsterState" AS ENUM ('IDLE', 'SLEEPING');

-- CreateTable
CREATE TABLE "Hamster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appearance" "HamsterAppearance" NOT NULL,
    "personality" TEXT NOT NULL DEFAULT '느긋함',
    "hunger" INTEGER NOT NULL DEFAULT 80,
    "thirst" INTEGER NOT NULL DEFAULT 80,
    "cleanliness" INTEGER NOT NULL DEFAULT 80,
    "mood" INTEGER NOT NULL DEFAULT 80,
    "stamina" INTEGER NOT NULL DEFAULT 80,
    "intimacy" INTEGER NOT NULL DEFAULT 0,
    "growthStage" TEXT NOT NULL DEFAULT 'BABY',
    "state" "HamsterState" NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hamster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hamster_userId_key" ON "Hamster"("userId");

-- AddForeignKey
ALTER TABLE "Hamster" ADD CONSTRAINT "Hamster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
