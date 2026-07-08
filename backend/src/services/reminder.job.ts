import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { notify } from "./notification.service";
import { logger } from "../lib/logger";

const REMINDER_HOUR_LOCAL = 9; // send once/day, around 9am clinic time

function getClinicNow(): Date {
  // Render's server TZ may not match the clinic's — resolve "now" in the
  // configured clinic timezone rather than trusting the process TZ.
  const timeZone = process.env.CLINIC_TIMEZONE || "UTC";
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  return new Date(new Date().toISOString().slice(0, 10) + `T${formatted.padStart(2, "0")}:00:00.000Z`);
}

export async function runReminderSweep() {
  const clinicHour = getClinicNow().getUTCHours();
  if (clinicHour !== REMINDER_HOUR_LOCAL) return;

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowDateOnly = new Date(tomorrow.toISOString().slice(0, 10));

  const appointments = await prisma.appointment.findMany({
    where: { date: tomorrowDateOnly, status: "APPROVED", reminderSentAt: null },
    include: { patient: { select: { id: true } } },
  });

  for (const appt of appointments) {
    await notify(appt.patientId, "REMINDER", {
      subject: "Appointment reminder",
      emailBody: `Reminder: you have an appointment tomorrow at ${appt.time}.`,
      smsBody: `Dentixa reminder: appointment tomorrow at ${appt.time}.`,
    });
    await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSentAt: new Date() } });
  }

  if (appointments.length) {
    logger.info(`Reminder sweep sent ${appointments.length} reminder(s) for ${tomorrowDateOnly.toISOString().slice(0, 10)}`);
  }
}

export function scheduleReminderJob() {
  // Hourly, but runReminderSweep no-ops outside the configured reminder hour —
  // hourly cadence keeps the "off by a few hours" risk low without a separate worker process.
  cron.schedule("0 * * * *", () => {
    runReminderSweep().catch((err) => logger.error("Reminder sweep failed:", err));
  });
}
