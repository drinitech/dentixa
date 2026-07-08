import crypto from "node:crypto";
import { prisma } from "../lib/prisma";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { buildIcsEvent, buildIcsCalendar } from "../lib/ics";

export async function listActiveDoctors() {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR", isActive: true },
    select: { id: true, name: true, email: true, avatarUrl: true, specialty: true },
    orderBy: { name: "asc" },
  });

  const ratings = await prisma.review.groupBy({
    by: ["doctorId"],
    where: { doctorId: { in: doctors.map((d) => d.id) } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const ratingByDoctorId = new Map(ratings.map((r) => [r.doctorId, r]));

  return doctors.map((d) => ({
    ...d,
    averageRating: ratingByDoctorId.get(d.id)?._avg.rating ?? null,
    reviewCount: ratingByDoctorId.get(d.id)?._count._all ?? 0,
  }));
}

// Lazily generated on first request rather than at account creation — most
// doctors will never use the calendar feed, so there's no point minting a
// secret token for every one of them up front.
export async function getOrCreateCalendarToken(doctorId: string): Promise<string> {
  const doctor = await prisma.user.findUnique({ where: { id: doctorId }, select: { calendarToken: true } });
  if (doctor?.calendarToken) return doctor.calendarToken;

  const token = crypto.randomBytes(24).toString("base64url");
  await prisma.user.update({ where: { id: doctorId }, data: { calendarToken: token } });
  return token;
}

// Public (unauthenticated) feed for calendar apps to poll — the token itself
// is the credential, since calendar clients can't send an Authorization header.
export async function getDoctorCalendarFeed(doctorId: string, token: string): Promise<string> {
  const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
  if (!doctor || doctor.role !== "DOCTOR" || !doctor.calendarToken || doctor.calendarToken !== token) {
    throw new UnauthorizedError("Invalid calendar link");
  }

  const appointments = await prisma.appointment.findMany({
    where: { doctorId, status: "APPROVED" },
    include: {
      patient: { select: { name: true } },
      service: { select: { name: true } },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const events = appointments.map((appt) =>
    buildIcsEvent({
      uid: appt.id,
      date: appt.date,
      time: appt.time,
      durationMinutes: appt.durationMinutes,
      summary: `Appointment with ${appt.patient.name}`,
      description: appt.service?.name,
      createdAt: appt.createdAt,
    }),
  );

  return buildIcsCalendar(events);
}
