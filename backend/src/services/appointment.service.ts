import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from "../errors/BadRequestError";
import { ForbiddenError } from "../errors/ForbiddenError";
import { ConflictError } from "../errors/ConflictError";
import { getFreeSlots } from "./slot.service";
import { rangesOverlap, timeToMinutes } from "../lib/time";
import type {
  CreateAppointmentInput,
  ListAppointmentsQuery,
  AdminListAppointmentsQuery,
} from "../validations/appointment.schema";

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

const appointmentInclude = {
  patient: { select: { id: true, name: true, email: true, phone: true } },
  doctor: { select: { id: true, name: true, email: true } },
  service: { select: { id: true, name: true, durationMinutes: true, price: true } },
} satisfies Prisma.AppointmentInclude;

export async function createAppointment(patientId: string, input: CreateAppointmentInput) {
  const doctor = await prisma.user.findUnique({ where: { id: input.doctorId } });
  if (!doctor || doctor.role !== "DOCTOR" || !doctor.isActive) {
    throw new BadRequestError("Selected doctor is not available");
  }

  const service = await prisma.clinicService.findUnique({ where: { id: input.serviceId } });
  if (!service || !service.isActive) {
    throw new BadRequestError("Selected service is not available");
  }

  const dateObj = parseDateOnly(input.date);
  const dayOfWeek = dateObj.getUTCDay();
  const windows = await prisma.doctorSchedule.findMany({ where: { doctorId: input.doctorId, dayOfWeek } });

  const requestStart = timeToMinutes(input.time);
  const requestEnd = requestStart + service.durationMinutes;
  const withinSchedule = windows.some(
    (w) => requestStart >= timeToMinutes(w.startTime) && requestEnd <= timeToMinutes(w.endTime),
  );
  if (!withinSchedule) {
    throw new BadRequestError("Requested time is outside the doctor's working hours");
  }

  // Best-effort UX check — the partial unique index below is the real source of truth.
  const freeSlots = await getFreeSlots(input.doctorId, input.date, input.serviceId);
  if (!freeSlots.includes(input.time)) {
    throw new ConflictError("This slot is no longer available, please choose another time");
  }

  try {
    return await prisma.appointment.create({
      data: {
        patientId,
        doctorId: input.doctorId,
        serviceId: input.serviceId,
        date: dateObj,
        time: input.time,
        durationMinutes: service.durationMinutes,
        reason: input.reason,
        status: "PENDING",
      },
      include: appointmentInclude,
    });
  } catch (err) {
    // Backstop for the race where two patients request the exact same slot
    // simultaneously — the partial unique index on (doctorId, date, time)
    // WHERE status IN ('PENDING','APPROVED') rejects the loser here. Prisma
    // maps any Postgres unique_violation (23505), including on indexes not
    // declared in schema.prisma, to P2002.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("This slot was just booked, please choose another time");
    }
    throw err;
  }
}

interface ListScope {
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  userId: string;
}

export async function listAppointments(
  scope: ListScope,
  query: ListAppointmentsQuery | AdminListAppointmentsQuery,
) {
  const where: Prisma.AppointmentWhereInput = {};

  if (scope.role === "PATIENT") where.patientId = scope.userId;
  if (scope.role === "DOCTOR") where.doctorId = scope.userId;
  // ADMIN calls this unscoped from /admin/appointments and may filter by doctorId explicitly.
  if (scope.role === "ADMIN" && "doctorId" in query && query.doctorId) where.doctorId = query.doctorId;

  if (query.status) where.status = query.status;
  if (query.from || query.to) {
    where.date = {
      ...(query.from ? { gte: parseDateOnly(query.from) } : {}),
      ...(query.to ? { lte: parseDateOnly(query.to) } : {}),
    };
  }

  return prisma.appointment.findMany({
    where,
    include: appointmentInclude,
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
}

export async function rejectAppointment(id: string, doctorId: string, rejectionReason?: string) {
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) throw new NotFoundError("Appointment not found");
  if (appt.doctorId !== doctorId) throw new ForbiddenError();
  if (appt.status !== "PENDING") throw new ConflictError("Only pending requests can be rejected");

  return prisma.appointment.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason },
    include: appointmentInclude,
  });
}

interface CancelActor {
  id: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
}

export async function cancelAppointment(id: string, actor: CancelActor) {
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) throw new NotFoundError("Appointment not found");

  const owns =
    (actor.role === "PATIENT" && appt.patientId === actor.id) ||
    (actor.role === "DOCTOR" && appt.doctorId === actor.id) ||
    actor.role === "ADMIN";
  if (!owns) throw new ForbiddenError();

  if (appt.status === "CANCELLED" || appt.status === "REJECTED") {
    throw new ConflictError("This appointment is already inactive");
  }

  return prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: appointmentInclude,
  });
}

interface ApproveResult {
  appointment: Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;
  autoRejected: { id: string; patientId: string }[];
}

// The concurrency-critical path: two doctors' browser tabs (or a doctor double-clicking)
// could both try to approve overlapping requests at once. We take a row lock on every
// active (pending/approved) appointment for this doctor+date before deciding anything,
// so a second concurrent transaction blocks until the first commits and then sees the
// already-updated state — no two transactions can approve conflicting slots.
export async function approveAppointment(id: string, doctorId: string): Promise<ApproveResult> {
  return prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundError("Appointment not found");
    if (appt.doctorId !== doctorId) throw new ForbiddenError();
    if (appt.status !== "PENDING") throw new ConflictError("Only pending requests can be approved");

    await tx.$queryRaw`
      SELECT id FROM "Appointment"
      WHERE "doctorId" = ${appt.doctorId} AND "date" = ${appt.date}
        AND status IN ('PENDING', 'APPROVED')
      FOR UPDATE
    `;

    const sameDayActive = await tx.appointment.findMany({
      where: {
        doctorId: appt.doctorId,
        date: appt.date,
        status: "PENDING",
        id: { not: appt.id },
      },
    });
    const overlapping = sameDayActive.filter((o) => rangesOverlap(appt, o));

    const updated = await tx.appointment.update({
      where: { id: appt.id },
      data: { status: "APPROVED" },
      include: appointmentInclude,
    });

    if (overlapping.length) {
      await tx.appointment.updateMany({
        where: { id: { in: overlapping.map((o) => o.id) } },
        data: {
          status: "REJECTED",
          rejectionReason: "Slot no longer available (another appointment was approved)",
        },
      });
    }

    return {
      appointment: updated,
      autoRejected: overlapping.map((o) => ({ id: o.id, patientId: o.patientId })),
    };
  });
}
