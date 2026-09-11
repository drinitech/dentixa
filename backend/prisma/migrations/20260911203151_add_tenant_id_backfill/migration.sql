-- Adds tenantId to every tenant-scoped table and backfills existing rows
-- (including real production data, not just seed data) into one demo
-- tenant. Follows the safe order: add nullable -> backfill -> set NOT NULL.
-- No data is dropped.

-- Step 0: make sure the demo tenant exists, whether or not the seed script
-- has run against this database yet. Same id/slug the seed script uses, so
-- running the seed afterwards just upserts the same row rather than
-- creating a duplicate.
INSERT INTO "Tenant" ("id", "name", "slug", "timezone", "plan", "status", "createdAt", "updatedAt")
VALUES ('demo-clinic', 'Dentixa Demo Clinic', 'demo-clinic', 'Europe/Belgrade', 'FREE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Step 1: add nullable tenantId to every tenant-scoped table.
ALTER TABLE "Location" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "ClinicService" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "DoctorSchedule" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "ScheduleException" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "ClinicHoliday" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Waitlist" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "RecallReminder" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Review" ADD COLUMN "tenantId" TEXT;

-- Step 2: backfill every existing row into the demo tenant.
UPDATE "Location" SET "tenantId" = 'demo-clinic' WHERE "tenantId" IS NULL;
UPDATE "ClinicService" SET "tenantId" = 'demo-clinic' WHERE "tenantId" IS NULL;
UPDATE "DoctorSchedule" SET "tenantId" = 'demo-clinic' WHERE "tenantId" IS NULL;
UPDATE "ScheduleException" SET "tenantId" = 'demo-clinic' WHERE "tenantId" IS NULL;
UPDATE "ClinicHoliday" SET "tenantId" = 'demo-clinic' WHERE "tenantId" IS NULL;
UPDATE "Waitlist" SET "tenantId" = 'demo-clinic' WHERE "tenantId" IS NULL;
UPDATE "Appointment" SET "tenantId" = 'demo-clinic' WHERE "tenantId" IS NULL;
UPDATE "RecallReminder" SET "tenantId" = 'demo-clinic' WHERE "tenantId" IS NULL;
UPDATE "Review" SET "tenantId" = 'demo-clinic' WHERE "tenantId" IS NULL;

-- Step 2b: every existing User becomes a Membership of the demo tenant too,
-- mapping the legacy global Role the same way seed.ts does. Skips users who
-- already have a Membership in this tenant (idempotent on re-run).
INSERT INTO "Membership" ("id", "userId", "tenantId", "role", "status", "createdAt", "updatedAt")
SELECT
  'mig_' || "id",
  "id",
  'demo-clinic',
  (CASE "role"::text WHEN 'ADMIN' THEN 'OWNER' ELSE "role"::text END)::"MembershipRole",
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
WHERE NOT EXISTS (
  SELECT 1 FROM "Membership" WHERE "Membership"."userId" = "User"."id" AND "Membership"."tenantId" = 'demo-clinic'
);

-- Step 3: every row now has a tenantId — enforce it.
ALTER TABLE "Location" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ClinicService" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DoctorSchedule" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ScheduleException" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ClinicHoliday" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Waitlist" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Appointment" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RecallReminder" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "tenantId" SET NOT NULL;

-- Step 4: foreign keys.
ALTER TABLE "Location" ADD CONSTRAINT "Location_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClinicService" ADD CONSTRAINT "ClinicService_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClinicHoliday" ADD CONSTRAINT "ClinicHoliday_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecallReminder" ADD CONSTRAINT "RecallReminder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: indexes. Location and ClinicService just get a plain tenantId
-- index; the rest replace their old doctorId/patientId-only indexes and
-- unique constraints with tenantId-prefixed versions, since a bare doctorId
-- (a User.id) can now span more than one tenant once a person holds a
-- DOCTOR Membership in two different clinics.
CREATE INDEX "Location_tenantId_idx" ON "Location"("tenantId");
CREATE INDEX "ClinicService_tenantId_idx" ON "ClinicService"("tenantId");

DROP INDEX "DoctorSchedule_doctorId_dayOfWeek_startTime_endTime_key";
DROP INDEX "DoctorSchedule_doctorId_idx";
CREATE UNIQUE INDEX "DoctorSchedule_tenantId_doctorId_dayOfWeek_startTime_endTime_key" ON "DoctorSchedule"("tenantId", "doctorId", "dayOfWeek", "startTime", "endTime");
CREATE INDEX "DoctorSchedule_tenantId_doctorId_idx" ON "DoctorSchedule"("tenantId", "doctorId");

DROP INDEX "ScheduleException_doctorId_date_key";
DROP INDEX "ScheduleException_doctorId_idx";
CREATE UNIQUE INDEX "ScheduleException_tenantId_doctorId_date_key" ON "ScheduleException"("tenantId", "doctorId", "date");
CREATE INDEX "ScheduleException_tenantId_doctorId_idx" ON "ScheduleException"("tenantId", "doctorId");

DROP INDEX "ClinicHoliday_locationId_date_key";
DROP INDEX "ClinicHoliday_locationId_idx";
CREATE UNIQUE INDEX "ClinicHoliday_tenantId_locationId_date_key" ON "ClinicHoliday"("tenantId", "locationId", "date");
CREATE INDEX "ClinicHoliday_tenantId_locationId_idx" ON "ClinicHoliday"("tenantId", "locationId");

DROP INDEX "Waitlist_patientId_doctorId_serviceId_date_key";
DROP INDEX "Waitlist_doctorId_date_idx";
CREATE UNIQUE INDEX "Waitlist_tenantId_patientId_doctorId_serviceId_date_key" ON "Waitlist"("tenantId", "patientId", "doctorId", "serviceId", "date");
CREATE INDEX "Waitlist_tenantId_doctorId_date_idx" ON "Waitlist"("tenantId", "doctorId", "date");

DROP INDEX "Appointment_doctorId_date_idx";
DROP INDEX "Appointment_patientId_idx";
DROP INDEX "Appointment_status_idx";
DROP INDEX "Appointment_date_idx";
CREATE INDEX "Appointment_tenantId_doctorId_date_idx" ON "Appointment"("tenantId", "doctorId", "date");
CREATE INDEX "Appointment_tenantId_patientId_idx" ON "Appointment"("tenantId", "patientId");
CREATE INDEX "Appointment_tenantId_status_idx" ON "Appointment"("tenantId", "status");
CREATE INDEX "Appointment_tenantId_date_idx" ON "Appointment"("tenantId", "date");

DROP INDEX "RecallReminder_patientId_status_idx";
DROP INDEX "RecallReminder_dueDate_status_idx";
CREATE INDEX "RecallReminder_tenantId_patientId_status_idx" ON "RecallReminder"("tenantId", "patientId", "status");
CREATE INDEX "RecallReminder_tenantId_dueDate_status_idx" ON "RecallReminder"("tenantId", "dueDate", "status");

DROP INDEX "Review_doctorId_idx";
CREATE INDEX "Review_tenantId_doctorId_idx" ON "Review"("tenantId", "doctorId");

-- Step 6: rebuild the race-safety partial unique index on Appointment so it
-- can never again treat two different tenants' identical doctor+date+time
-- as a conflict, and — the actual correctness fix — so one User holding a
-- DOCTOR Membership in two different tenants can have appointments at both
-- in the same slot. See appointment.service.ts (approveAppointment /
-- createAppointment) for how this index and the app-level transaction work
-- together.
DROP INDEX "appointment_active_slot_unique";
CREATE UNIQUE INDEX "appointment_active_slot_unique"
ON "Appointment" ("tenantId", "doctorId", "date", "time")
WHERE "status" IN ('PENDING', 'APPROVED');
