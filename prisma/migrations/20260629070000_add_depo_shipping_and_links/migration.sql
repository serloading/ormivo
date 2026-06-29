ALTER TABLE "Finance" ADD COLUMN "depoSiparisId" TEXT;
CREATE UNIQUE INDEX "Finance_depoSiparisId_key" ON "Finance"("depoSiparisId");

ALTER TABLE "SupplierDebt" ADD COLUMN "depoSiparisId" TEXT;
CREATE UNIQUE INDEX "SupplierDebt_depoSiparisId_key" ON "SupplierDebt"("depoSiparisId");

ALTER TABLE "DepoSiparis" ADD COLUMN "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "DepoSiparis" ADD COLUMN "depoName" TEXT;
ALTER TABLE "DepoSiparis" ADD COLUMN "depoPhone" TEXT;
