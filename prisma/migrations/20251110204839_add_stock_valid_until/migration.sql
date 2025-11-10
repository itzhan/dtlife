-- Add missing validUntil column so Prisma schema stays in sync
ALTER TABLE "Stock"
ADD COLUMN "validUntil" TIMESTAMP(3);
