import { prisma } from "../lib/prisma";
import { minutesToTime, timeToMinutes, rangesOverlap } from "../lib/time";
import { NotFoundError } from "../errors/NotFoundError";

// Parses a "YYYY-MM-DD" string as a UTC calendar date, matching how it's stored
// in Postgres via @db.Date (avoids local-timezone off-by-one-day drift).
function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export async function getFreeSlots(doctorId: string, date: string, serviceId: string): Promise<string[]> {
  const service = await prisma.clinicService.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) throw new NotFoundError("Service not found");

  const dateObj = parseDateOnly(date);
  const dayOfWeek = dateObj.getUTCDay();

  const [schedules, booked] = await Promise.all([
    prisma.doctorSchedule.findMany({ where: { doctorId, dayOfWeek } }),
    prisma.appointment.findMany({
      where: { doctorId, date: dateObj, status: "APPROVED" },
      select: { time: true, durationMinutes: true },
    }),
  ]);

  const duration = service.durationMinutes;
  const now = new Date();
  const isToday = dateObj.toDateString() === new Date(now.toISOString().slice(0, 10)).toDateString();
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const freeSlots: string[] = [];

  for (const window of schedules) {
    const windowStart = timeToMinutes(window.startTime);
    const windowEnd = timeToMinutes(window.endTime);

    // Slots are generated at the selected service's duration, so a 60-minute
    // service naturally shows fewer, farther-apart start times than a 30-minute one.
    for (let t = windowStart; t + duration <= windowEnd; t += duration) {
      if (isToday && t <= nowMinutes) continue;

      const candidate = { time: minutesToTime(t), durationMinutes: duration };
      const conflicts = booked.some((b) => rangesOverlap(candidate, b));
      if (!conflicts) freeSlots.push(candidate.time);
    }
  }

  return freeSlots;
}
