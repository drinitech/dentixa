-- Rename: Clinic -> Location. Frees up "Clinic" as a name so a later
-- migration can introduce Tenant (the SaaS customer/business) without a
-- name collision with this (a physical address) concept. Pure rename,
-- no data change.

ALTER TABLE "Clinic" RENAME TO "Location";
ALTER TABLE "Location" RENAME CONSTRAINT "Clinic_pkey" TO "Location_pkey";

ALTER TABLE "User" RENAME COLUMN "clinicId" TO "locationId";
ALTER INDEX "User_clinicId_idx" RENAME TO "User_locationId_idx";
ALTER TABLE "User" RENAME CONSTRAINT "User_clinicId_fkey" TO "User_locationId_fkey";

ALTER TABLE "ClinicHoliday" RENAME COLUMN "clinicId" TO "locationId";
ALTER INDEX "ClinicHoliday_clinicId_date_key" RENAME TO "ClinicHoliday_locationId_date_key";
ALTER INDEX "ClinicHoliday_clinicId_idx" RENAME TO "ClinicHoliday_locationId_idx";
ALTER TABLE "ClinicHoliday" RENAME CONSTRAINT "ClinicHoliday_clinicId_fkey" TO "ClinicHoliday_locationId_fkey";
