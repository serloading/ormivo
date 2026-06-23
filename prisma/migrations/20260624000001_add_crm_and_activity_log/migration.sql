-- Customer: segment ve tags alanları
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "segment" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}';

-- CustomerNote tablosu
CREATE TABLE IF NOT EXISTS "CustomerNote" (
  "id"         TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "content"    TEXT NOT NULL,
  "createdBy"  TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ActivityLog tablosu
CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id"         TEXT NOT NULL,
  "adminEmail" TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "entity"     TEXT NOT NULL,
  "entityId"   TEXT NOT NULL,
  "detail"     JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);
