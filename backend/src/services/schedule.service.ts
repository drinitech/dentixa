import { prisma } from "../lib/prisma";
import type { ReplaceScheduleInput } from "../validations/schedule.schema";

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
    await tx.doctorSchedule.createMany({
      data: input.windows.map((w) => ({ ...w, doctorId })),
    });
    return tx.doctorSchedule.findMany({
      where: { doctorId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  });
}
