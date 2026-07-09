-- CreateEnum
CREATE TYPE "RecallStatus" AS ENUM ('PENDING', 'NOTIFIED', 'BOOKED', 'DISMISSED');

-- AlterTable
ALTER TABLE "ClinicService" ADD COLUMN "recallIntervalMonths" INTEGER;

-- CreateTable
CREATE TABLE "RecallReminder" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "sourceAppointmentId" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "status" "RecallStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecallReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecallReminder_sourceAppointmentId_key" ON "RecallReminder"("sourceAppointmentId");
CREATE INDEX "RecallReminder_patientId_status_idx" ON "RecallReminder"("patientId", "status");
CREATE INDEX "RecallReminder_dueDate_status_idx" ON "RecallReminder"("dueDate", "status");

-- AddForeignKey
ALTER TABLE "RecallReminder" ADD CONSTRAINT "RecallReminder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecallReminder" ADD CONSTRAINT "RecallReminder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecallReminder" ADD CONSTRAINT "RecallReminder_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ClinicService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecallReminder" ADD CONSTRAINT "RecallReminder_sourceAppointmentId_fkey" FOREIGN KEY ("sourceAppointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
