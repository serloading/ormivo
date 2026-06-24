ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "customerNo" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_customerNo_key" ON "Customer"("customerNo");
