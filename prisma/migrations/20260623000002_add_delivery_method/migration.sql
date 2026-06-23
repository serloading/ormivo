-- AlterTable SiteOrder: add deliveryMethod
ALTER TABLE "SiteOrder" ADD COLUMN IF NOT EXISTS "deliveryMethod" TEXT NOT NULL DEFAULT 'CARGO';
