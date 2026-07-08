-- Prevents two active (pending or approved) appointments from ever existing
-- for the same doctor/date/time, even under concurrent requests. Prisma's
-- schema DSL can't express a partial/filtered unique index, so this is
-- hand-written. See backend/src/services/appointment.service.ts for how the
-- app-level transaction and this index work together.
CREATE UNIQUE INDEX "appointment_active_slot_unique"
ON "Appointment" ("doctorId", "date", "time")
WHERE "status" IN ('PENDING', 'APPROVED');
