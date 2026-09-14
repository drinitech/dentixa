import cron from "node-cron";
// Runs on a timer, not per-request — there is no tenant context to inject,
// and this intentionally sweeps every tenant's due recalls at once, so it
// uses the raw client rather than the tenant-scoped one.
import { prismaUnscoped as prisma } from "../lib/prisma";
import { notify } from "./notification.service";
import { logger } from "../lib/logger";
import { getClinicNow } from "../lib/time";

const SWEEP_HOUR_LOCAL = 9; // once/day, around 9am clinic time — recall due dates are month-granularity

export async function runRecallSweep() {
  const clinicNow = getClinicNow();
  if (Math.floor(clinicNow.minutesOfDay / 60) !== SWEEP_HOUR_LOCAL) return;

  const today = new Date(clinicNow.dateKey);

  const due = await prisma.recallReminder.findMany({
    where: { status: "PENDING", dueDate: { lte: today } },
    include: { service: { select: { name: true } }, tenant: { select: { name: true } } },
  });

  for (const recall of due) {
    // Reuses the REMINDER notification-preference slot rather than adding a
    // new event type + preferences UI just for this — same email/SMS toggle
    // a patient already uses for appointment reminders.
    await notify(recall.patientId, "REMINDER", {
      subject: `[${recall.tenant.name}] Time for your checkup`,
      emailBody: `It's been a while since your last ${recall.service.name.toLowerCase()} at ${recall.tenant.name} — you're due for another. Book your next appointment when you're ready.`,
      smsBody: `${recall.tenant.name}: you're due for a ${recall.service.name} checkup — book your next visit.`,
    });
    await prisma.recallReminder.update({
      where: { id: recall.id },
      data: { status: "NOTIFIED", notifiedAt: new Date() },
    });
  }

  if (due.length) {
    logger.info(`Recall sweep notified ${due.length} patient(s)`);
  }
}

export function scheduleRecallJob() {
  // Hourly, but runRecallSweep no-ops outside the configured sweep hour —
  // same pattern as the appointment reminder job.
  cron.schedule("0 * * * *", () => {
    runRecallSweep().catch((err) => logger.error("Recall sweep failed:", err));
  });
}
