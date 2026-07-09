import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError } from "../errors/ConflictError";
import { NotFoundError } from "../errors/NotFoundError";
import type { CreateClinicHolidayInput } from "../validations/clinicHoliday.schema";

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

// clinicId omitted: every holiday (clinic-specific and global). clinicId
// given: that clinic's own holidays plus the global (clinicId null) ones —
// mirrors how getFreeSlots decides whether a date is closed for a doctor.
export async function listClinicHolidays(clinicId?: string) {
  if (!clinicId) {
    return prisma.clinicHoliday.findMany({ orderBy: { date: "asc" } });
  }
  return prisma.clinicHoliday.findMany({
    where: { OR: [{ clinicId }, { clinicId: null }] },
    orderBy: { date: "asc" },
  });
}

export async function addClinicHoliday(input: CreateClinicHolidayInput) {
  const clinicId = input.clinicId ?? null;

  // A plain unique-index catch doesn't work here since Postgres treats every
  // NULL clinicId as distinct — check explicitly instead so duplicate global
  // holidays are rejected too.
  const existing = await prisma.clinicHoliday.findFirst({
    where: { date: parseDateOnly(input.date), clinicId },
  });
  if (existing) throw new ConflictError("That date is already marked as a holiday for this scope");

  try {
    return await prisma.clinicHoliday.create({
      data: { date: parseDateOnly(input.date), reason: input.reason, clinicId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("That date is already marked as a holiday for this scope");
    }
    throw err;
  }
}

export async function removeClinicHoliday(id: string) {
  const holiday = await prisma.clinicHoliday.findUnique({ where: { id } });
  if (!holiday) throw new NotFoundError("Holiday not found");
  await prisma.clinicHoliday.delete({ where: { id } });
}
