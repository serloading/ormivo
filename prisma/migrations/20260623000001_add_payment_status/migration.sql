-- AlterTable SiteOrder: add paymentStatus
ALTER TABLE "SiteOrder" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable Finance: add siteOrderId reference
ALTER TABLE "Finance" ADD COLUMN IF NOT EXISTS "siteOrderId" TEXT;
