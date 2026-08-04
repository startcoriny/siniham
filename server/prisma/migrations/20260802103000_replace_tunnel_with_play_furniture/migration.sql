-- 터널을 제거하고 실제로 행동이 연결되는 가구 3종(모래목욕통/해바라기씨 접시/전망대)으로 교체한다.
-- 터널은 이미지도 행동도 없는 빈 아이템이었으므로, 이미 구매한 사용자는 손해를 보지 않도록
-- 같은 값어치의 모래목욕통으로 바꿔준다.

-- enum에서 값을 빼려면 타입을 새로 만들어 갈아끼워야 한다.
CREATE TYPE "ItemId_new" AS ENUM (
  'FOOD_BOWL',
  'WATER_BOTTLE',
  'HANDHELD_WATER_BOTTLE',
  'WATER_BOWL',
  'HOUSE',
  'WHEEL',
  'SAND_BATH',
  'SNACK_DISH',
  'LOOKOUT'
);

-- 타입을 바꾸는 동안에는 FK를 잠시 떼어둔다.
ALTER TABLE "CageItem" DROP CONSTRAINT "CageItem_itemMasterId_fkey";

-- 변환하면서 TUNNEL을 SAND_BATH로 매핑한다. ItemMaster와 CageItem 양쪽을 같은 규칙으로 바꿔야
-- 참조가 어긋나지 않는다. SAND_BATH를 이미 들고 있던 사용자는 없으므로(신규 값) 유니크 충돌도 없다.
ALTER TABLE "ItemMaster"
  ALTER COLUMN "id" TYPE "ItemId_new"
  USING (CASE WHEN "id"::text = 'TUNNEL' THEN 'SAND_BATH' ELSE "id"::text END)::"ItemId_new";

ALTER TABLE "CageItem"
  ALTER COLUMN "itemMasterId" TYPE "ItemId_new"
  USING (CASE WHEN "itemMasterId"::text = 'TUNNEL' THEN 'SAND_BATH' ELSE "itemMasterId"::text END)::"ItemId_new";

ALTER TYPE "ItemId" RENAME TO "ItemId_old";
ALTER TYPE "ItemId_new" RENAME TO "ItemId";
DROP TYPE "ItemId_old";

ALTER TABLE "CageItem"
  ADD CONSTRAINT "CageItem_itemMasterId_fkey"
  FOREIGN KEY ("itemMasterId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 터널에서 넘어온 행은 이름과 가격이 아직 '터널 150'이므로 여기서 바로잡는다.
-- (서버 부팅 시 seedItemMasters()도 같은 값으로 upsert 한다)
UPDATE "ItemMaster" SET "name" = '모래목욕통', "cost" = 120, "purchasable" = true WHERE "id" = 'SAND_BATH';

INSERT INTO "ItemMaster" ("id", "name", "cost", "purchasable") VALUES
  ('SAND_BATH', '모래목욕통', 120, true),
  ('SNACK_DISH', '해바라기씨 접시', 120, true),
  ('LOOKOUT', '전망대', 120, true)
ON CONFLICT ("id") DO NOTHING;
