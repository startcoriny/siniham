-- 정원을 16개 슬롯과 작물별 씨앗·수확물 인벤토리 구조로 확장한다.
CREATE TYPE "CropId" AS ENUM ('CARROT', 'STRAWBERRY', 'TOMATO', 'SUNFLOWER');

ALTER TABLE "User"
ADD COLUMN "seedInventory" JSONB NOT NULL DEFAULT '{"CARROT":1,"STRAWBERRY":0,"TOMATO":0,"SUNFLOWER":0}',
ADD COLUMN "produceInventory" JSONB NOT NULL DEFAULT '{"CARROT":0,"STRAWBERRY":0,"TOMATO":0,"SUNFLOWER":0}';

UPDATE "User"
SET "seedInventory" = jsonb_build_object('CARROT', "seedCount", 'STRAWBERRY', 0, 'TOMATO', 0, 'SUNFLOWER', 0);

ALTER TABLE "GardenPlot" ADD COLUMN "cropId" "CropId";
UPDATE "GardenPlot" SET "cropId" = 'CARROT' WHERE "status" <> 'EMPTY';
