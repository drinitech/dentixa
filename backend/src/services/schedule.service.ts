import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError } from "../errors/ConflictError";
import { ForbiddenError } from "../errors/ForbiddenError";
import { NotFoundError } from "../errors/NotFoundError";
import { getTenantId } from "../lib/tenantContext";
import type { ReplaceScheduleInput, CreateExceptionInput } from "../validations/schedule.schema";

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export async function getSchedule(doctorId: string) {
  return prisma.doctorSchedule.findMany({
    where: { doctorId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

// Replace-all semantics: simplest to reason about vs incremental patch —
// the doctor submits their complete weekly schedule and it fully replaces the old one.
export async function replaceSchedule(doctorId: string, input: ReplaceScheduleInput) {
  return prisma.$transaction(async (tx) => {
    await tx.doctorSchedule.deleteMany({ where: { doctorId } });
    if (input.windows.length === 0) return [];
    const tenantId = getTenantId();
    await tx.doctorSchedule.createMany({
      data: input.windows.map((w) => ({ ...w, doctorId, tenantId })),
    });
    return tx.doctorSchedule.findMany({
      where: { doctorId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  });
}

export async function listExceptions(doctorId: string) {
  return prisma.scheduleException.findMany({
    where: { doctorId },
    orderBy: { date: "asc" },
  });
}

export async function addException(doctorId: string, input: CreateExceptionInput) {
  try {
    return await prisma.scheduleException.create({
      data: { tenantId: getTenantId(), doctorId, date: parseDateOnly(input.date), reason: input.reason },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("That date is already marked as time off");
    }
    throw err;
  }
}

export async function removeException(doctorId: string, id: string) {
  const exception = await prisma.scheduleException.findUnique({ where: { id } });
  if (!exception) throw new NotFoundError("Exception not found");
  if (exception.doctorId !== doctorId) throw new ForbiddenError();

  await prisma.scheduleException.delete({ where: { id } });
}
