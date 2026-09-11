import { prisma } from "../lib/prisma";
import { minutesToTime, timeToMinutes, rangesOverlap, getClinicNow } from "../lib/time";
import { NotFoundError } from "../errors/NotFoundError";
import { getTenantId } from "../lib/tenantContext";

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

  const doctor = await prisma.user.findUnique({ where: { id: doctorId }, select: { locationId: true } });

  const [exception, holiday] = await Promise.all([
    // The compound-unique selector requires tenantId as a literal field, so
    // it's passed explicitly here — the Prisma extension's blind top-level
    // where-merge can't reach inside a nested unique-selector object like
    // this one. Every other query below is a plain filter, which the
    // extension does handle automatically.
    prisma.scheduleException.findUnique({
      where: { tenantId_doctorId_date: { tenantId: getTenantId(), doctorId, date: dateObj } },
    }),
    // A holiday applies here if it's global (locationId null) or scoped to this doctor's own location.
    prisma.clinicHoliday.findFirst({
      where: doctor?.locationId
        ? { date: dateObj, OR: [{ locationId: null }, { locationId: doctor.locationId }] }
        : { date: dateObj, locationId: null },
    }),
  ]);
  if (exception || holiday) return [];

  const [schedules, booked] = await Promise.all([
    prisma.doctorSchedule.findMany({ where: { doctorId, dayOfWeek } }),
    prisma.appointment.findMany({
      where: { doctorId, date: dateObj, status: "APPROVED" },
      select: { time: true, durationMinutes: true },
    }),
  ]);

  const duration = service.durationMinutes;
  const clinicNow = getClinicNow();
  const isToday = date === clinicNow.dateKey;
  const nowMinutes = clinicNow.minutesOfDay;

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
