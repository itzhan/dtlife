-- AlterTable
ALTER TABLE "Stock"
ADD COLUMN "serialNumber" INTEGER;

-- Backfill existing records so每个套餐内部的序号从1开始递增
WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "packageId" ORDER BY "createdAt", "id") AS rn
  FROM "Stock"
)
UPDATE "Stock" AS s
SET "serialNumber" = ranked.rn
FROM ranked
WHERE s."id" = ranked."id";
