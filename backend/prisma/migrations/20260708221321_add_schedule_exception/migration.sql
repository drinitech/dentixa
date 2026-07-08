-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleException_doctorId_idx" ON "ScheduleException"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleException_doctorId_date_key" ON "ScheduleException"("doctorId", "date");

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
