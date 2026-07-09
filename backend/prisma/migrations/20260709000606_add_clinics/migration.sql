-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- AlterTable: User gets an optional clinic assignment (doctors only, enforced in app layer)
ALTER TABLE "User" ADD COLUMN "clinicId" TEXT;

-- CreateIndex
CREATE INDEX "User_clinicId_idx" ON "User"("clinicId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: ClinicHoliday becomes scoped per-clinic (null = applies to every clinic)
DROP INDEX "ClinicHoliday_date_key";
ALTER TABLE "ClinicHoliday" ADD COLUMN "clinicId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClinicHoliday_clinicId_date_key" ON "ClinicHoliday"("clinicId", "date");
CREATE INDEX "ClinicHoliday_clinicId_idx" ON "ClinicHoliday"("clinicId");

-- AddForeignKey
ALTER TABLE "ClinicHoliday" ADD CONSTRAINT "ClinicHoliday_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: existing doctors need a clinic so booking/filtering doesn't
-- orphan them. Create one default clinic and assign every current doctor to it.
INSERT INTO "Clinic" ("id", "name", "address", "phone", "isActive", "createdAt", "updatedAt")
VALUES ('default-clinic', 'Klinika Kryesore', NULL, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "User" SET "clinicId" = 'default-clinic' WHERE "role" = 'DOCTOR';
