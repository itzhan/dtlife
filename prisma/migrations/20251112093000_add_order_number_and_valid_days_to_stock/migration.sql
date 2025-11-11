-- Add orderNumber and validDays to Stock
ALTER TABLE "Stock"
  ADD COLUMN "orderNumber" TEXT,
  ADD COLUMN "validDays" INTEGER;
