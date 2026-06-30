-- AlterTable Product: add isNew flag
ALTER TABLE "Product" ADD COLUMN "isNew" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Customer: add birthDate
ALTER TABLE "Customer" ADD COLUMN "birthDate" TIMESTAMP(3);

-- AlterTable SiteUser: add email
ALTER TABLE "SiteUser" ADD COLUMN "email" TEXT;
