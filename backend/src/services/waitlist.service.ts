import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { ForbiddenError } from "../errors/ForbiddenError";
import { ConflictError } from "../errors/ConflictError";
import { BadRequestError } from "../errors/BadRequestError";
import { getFreeSlots } from "./slot.service";
import { sendEmail, getCurrentClinicName } from "./notification.service";
import { getTenantId } from "../lib/tenantContext";
import type { JoinWaitlistInput } from "../validations/waitlist.schema";

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

const waitlistInclude = {
  doctor: { select: { id: true, name: true } },
  service: { select: { id: true, name: true } },
} satisfies Prisma.WaitlistInclude;

export async function joinWaitlist(patientId: string, input: JoinWaitlistInput) {
  const freeSlots = await getFreeSlots(input.doctorId, input.date, input.serviceId);
  if (freeSlots.length > 0) {
    throw new BadRequestError("Slots are still available for this date — book directly instead");
  }

  try {
    return await prisma.waitlist.create({
      data: {
        tenantId: getTenantId(),
        patientId,
        doctorId: input.doctorId,
        serviceId: input.serviceId,
        date: parseDateOnly(input.date),
      },
      include: waitlistInclude,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("You're already on the waitlist for this date");
    }
    throw err;
  }
}

export async function listMyWaitlist(patientId: string) {
  return prisma.waitlist.findMany({
    where: { patientId },
    include: waitlistInclude,
    orderBy: { date: "asc" },
  });
}

export async function leaveWaitlist(patientId: string, id: string) {
  const entry = await prisma.waitlist.findUnique({ where: { id } });
  if (!entry) throw new NotFoundError("Waitlist entry not found");
  if (entry.patientId !== patientId) throw new ForbiddenError();

  await prisma.waitlist.delete({ where: { id } });
}

// Called after any action that frees up a slot (cancel, reject) for a given
// doctor+date. Re-checks free slots per waitlisted service — a freed 30-minute
// slot might not fit a 60-minute service someone's waiting on — and emails +
// clears only the entries that actually became bookable.
export async function notifyWaitlistIfSlotsOpened(doctorId: string, date: string): Promise<void> {
  const entries = await prisma.waitlist.findMany({
    where: { doctorId, date: parseDateOnly(date) },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
    },
  });
  if (entries.length === 0) return;

  const clinicName = await getCurrentClinicName();

  for (const entry of entries) {
    try {
      const freeSlots = await getFreeSlots(doctorId, date, entry.serviceId);
      if (freeSlots.length === 0) continue;

      await sendEmail(
        entry.patient.email,
        `[${clinicName}] A slot just opened up`,
        `<p>Good news — a slot opened up with Dr. ${entry.doctor.name} on ${date} for ${entry.service.name} at ${clinicName}. Log in to book it before it's taken.</p>`,
      );
      await prisma.waitlist.delete({ where: { id: entry.id } });
    } catch {
      // Never let one bad email/delete block notifying the rest of the waitlist.
    }
  }
}
