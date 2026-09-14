import { prisma, prismaUnscoped } from "../lib/prisma";
import { getTenantId } from "../lib/tenantContext";
import { BadRequestError } from "../errors/BadRequestError";

// Milestone 7 — basic Free vs Pro plan limits, enforced server-side (not
// just hidden/disabled in the UI, which a direct API call would bypass).
// Payment itself stays manual for now (a Super Admin flips the plan after a
// bank transfer — see superAdmin.service.ts's changePlan), so this is the
// only piece "Plane dhe limite bazë" actually needs. SMS-gating and clinic
// branding (also listed under the scope doc's Phase 2) are deferred: SMS
// gating would need tenantId threaded through notify()'s cross-tenant cron
// call sites (reminder.job.ts/recall.job.ts have no resolved tenant context
// to read a plan from), and branding has no logo-upload feature to gate yet.
export const FREE_DOCTOR_LIMIT = 1;
export const FREE_MONTHLY_APPOINTMENT_LIMIT = 100;

async function getCurrentTenantPlan(): Promise<"FREE" | "PRO"> {
  const tenant = await prismaUnscoped.tenant.findUnique({ where: { id: getTenantId() }, select: { plan: true } });
  return tenant?.plan ?? "FREE";
}

export async function assertDoctorLimit(tenantId: string): Promise<void> {
  const plan = await getCurrentTenantPlan();
  if (plan === "PRO") return;

  const count = await prismaUnscoped.membership.count({ where: { tenantId, role: "DOCTOR", status: "ACTIVE" } });
  if (count >= FREE_DOCTOR_LIMIT) {
    throw new BadRequestError(
      `The Free plan is limited to ${FREE_DOCTOR_LIMIT} doctor. Upgrade to Pro to add more.`,
    );
  }
}

// Counted by when the booking was MADE (createdAt), not the appointment's
// visit date — this is a usage-volume limit (how much of the system a
// clinic is using this month), the same way a billing meter works, not a
// calendar-availability check.
export async function assertAppointmentLimit(): Promise<void> {
  const plan = await getCurrentTenantPlan();
  if (plan === "PRO") return;

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const count = await prisma.appointment.count({ where: { createdAt: { gte: monthStart, lt: nextMonthStart } } });
  if (count >= FREE_MONTHLY_APPOINTMENT_LIMIT) {
    throw new BadRequestError(
      `The Free plan is limited to ${FREE_MONTHLY_APPOINTMENT_LIMIT} appointments per month. Upgrade to Pro for more.`,
    );
  }
}
