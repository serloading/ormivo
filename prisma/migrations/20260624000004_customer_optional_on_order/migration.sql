-- Make customerId nullable on Order (customer deletion keeps orders)
ALTER TABLE "Order" ALTER COLUMN "customerId" DROP NOT NULL;

-- Drop old FK and recreate with SET NULL
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_customerId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
