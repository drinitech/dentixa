import { prisma } from "../lib/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { ForbiddenError } from "../errors/ForbiddenError";

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

interface SourceAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string | null;
  date: Date;
}

// Called when an appointment is marked DONE for a service that has a
// recallIntervalMonths set. One-shot: sourceAppointmentId is unique, and
// completeAppointment can only transition an appointment to DONE once, so
// there's no risk of creating duplicates for the same visit.
export async function scheduleRecall(appt: SourceAppointment, intervalMonths: number) {
  if (!appt.serviceId) return;
  await prisma.recallReminder.create({
    data: {
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      serviceId: appt.serviceId,
      sourceAppointmentId: appt.id,
      dueDate: addMonths(appt.date, intervalMonths),
    },
  });
}

// Closes out any open recall for this patient+doctor+service once they book
// again for the same combination — the reminder did its job.
export async function markRecallsBooked(patientId: string, doctorId: string, serviceId: string) {
  await prisma.recallReminder.updateMany({
    where: { patientId, doctorId, serviceId, status: { in: ["PENDING", "NOTIFIED"] } },
    data: { status: "BOOKED" },
  });
}

export async function listMyRecalls(patientId: string) {
  return prisma.recallReminder.findMany({
    where: { patientId, status: { in: ["PENDING", "NOTIFIED"] } },
    include: {
      doctor: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function dismissRecall(id: string, patientId: string) {
  const recall = await prisma.recallReminder.findUnique({ where: { id } });
  if (!recall) throw new NotFoundError("Recall not found");
  if (recall.patientId !== patientId) throw new ForbiddenError();
  return prisma.recallReminder.update({ where: { id }, data: { status: "DISMISSED" } });
}
