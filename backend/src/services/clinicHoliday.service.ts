import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError } from "../errors/ConflictError";
import { NotFoundError } from "../errors/NotFoundError";
import type { CreateClinicHolidayInput } from "../validations/clinicHoliday.schema";

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export async function listClinicHolidays() {
  return prisma.clinicHoliday.findMany({ orderBy: { date: "asc" } });
}

export async function addClinicHoliday(input: CreateClinicHolidayInput) {
  try {
    return await prisma.clinicHoliday.create({
      data: { date: parseDateOnly(input.date), reason: input.reason },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("That date is already marked as a clinic holiday");
    }
    throw err;
  }
}

export async function removeClinicHoliday(id: string) {
  const holiday = await prisma.clinicHoliday.findUnique({ where: { id } });
  if (!holiday) throw new NotFoundError("Holiday not found");
  await prisma.clinicHoliday.delete({ where: { id } });
}
