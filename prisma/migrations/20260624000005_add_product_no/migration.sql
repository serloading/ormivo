ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "productNo" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Product_productNo_key" ON "Product"("productNo");
