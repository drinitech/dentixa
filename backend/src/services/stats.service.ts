import { prisma } from "../lib/prisma";
import { getTenantId } from "../lib/tenantContext";
import { FREE_DOCTOR_LIMIT, FREE_MONTHLY_APPOINTMENT_LIMIT } from "./planLimits.service";

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day; // Sunday as week start
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function getDoctorStats(doctorId: string) {
  const weekStart = startOfWeek();

  const [appointmentsThisWeek, rejectionsCount, pendingCount, doneCount, noShowCount] = await Promise.all([
    prisma.appointment.count({
      where: { doctorId, status: "APPROVED", date: { gte: weekStart } },
    }),
    prisma.appointment.count({ where: { doctorId, status: "REJECTED" } }),
    prisma.appointment.count({ where: { doctorId, status: "PENDING" } }),
    prisma.appointment.count({ where: { doctorId, status: "DONE" } }),
    prisma.appointment.count({ where: { doctorId, status: "NO_SHOW" } }),
  ]);

  return { appointmentsThisWeek, rejectionsCount, pendingCount, doneCount, noShowCount };
}

export async function getAdminStats(tenantId: string) {
  const today = startOfToday();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const weekStart = startOfWeek();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));

  const [
    tenant,
    totalAppointments,
    byStatusRaw,
    perDoctorRaw,
    monthlyTrendRaw,
    todayCount,
    thisWeekCount,
    doneCount,
    noShowCount,
    serviceCountsRaw,
    revenueRaw,
    // Same "created this calendar month" counting as planLimits.service.ts's
    // assertAppointmentLimit — this is the usage number that check enforces.
    appointmentsThisMonth,
  ] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    prisma.appointment.count(),
    prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.appointment.groupBy({ by: ["doctorId", "status"], _count: { _all: true } }),
    // Raw query bypasses the Prisma extension's automatic tenantId
    // injection, so it's filtered explicitly here — getTenantId() reads the
    // same AsyncLocalStorage context resolveTenant established, so this is
    // guaranteed to match the tenantId param passed in.
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char(date_trunc('month', "date"), 'YYYY-MM') AS month, COUNT(*)::bigint AS count
      FROM "Appointment"
      WHERE "tenantId" = ${getTenantId()}
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 12
    `,
    prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow } } }),
    prisma.appointment.count({ where: { date: { gte: weekStart } } }),
    prisma.appointment.count({ where: { status: "DONE" } }),
    prisma.appointment.count({ where: { status: "NO_SHOW" } }),
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: { serviceId: { not: null } },
      _count: { _all: true },
    }),
    // Revenue only counts completed visits, not pending/future ones — same
    // tenantId caveat as monthlyTrend above (raw query, explicit filter).
    prisma.$queryRaw<{ revenue: string | null }[]>`
      SELECT COALESCE(SUM(cs.price), 0)::text AS revenue
      FROM "Appointment" a
      JOIN "ClinicService" cs ON cs.id = a."serviceId"
      WHERE a."tenantId" = ${getTenantId()} AND a.status = 'DONE'
    `,
    prisma.appointment.count({ where: { createdAt: { gte: monthStart, lt: nextMonthStart } } }),
  ]);

  // User isn't tenant-scoped by the extension, so this filters via Membership explicitly.
  const doctors = await prisma.user.findMany({
    where: { memberships: { some: { tenantId, role: "DOCTOR" } } },
    select: { id: true, name: true },
  });

  const perDoctor = doctors.map((doctor) => {
    const rows = perDoctorRaw.filter((r) => r.doctorId === doctor.id);
    const total = rows.reduce((sum, r) => sum + r._count._all, 0);
    const approved = rows.find((r) => r.status === "APPROVED")?._count._all ?? 0;
    const rejected = rows.find((r) => r.status === "REJECTED")?._count._all ?? 0;
    return { doctorId: doctor.id, doctorName: doctor.name, total, approved, rejected };
  });

  const topServiceCounts = [...serviceCountsRaw].sort((a, b) => b._count._all - a._count._all).slice(0, 5);
  const topServiceIds = topServiceCounts.map((r) => r.serviceId).filter((id): id is string => id !== null);
  const services = topServiceIds.length
    ? await prisma.clinicService.findMany({ where: { id: { in: topServiceIds } }, select: { id: true, name: true } })
    : [];
  const topServices = topServiceCounts.map((r) => ({
    serviceId: r.serviceId!,
    serviceName: services.find((s) => s.id === r.serviceId)?.name ?? "Unknown",
    count: r._count._all,
  }));

  const completedOrNoShow = doneCount + noShowCount;
  const noShowRate = completedOrNoShow > 0 ? (noShowCount / completedOrNoShow) * 100 : 0;

  return {
    totalAppointments,
    byStatus: Object.fromEntries(byStatusRaw.map((r) => [r.status, r._count._all])),
    perDoctor,
    monthlyTrend: monthlyTrendRaw.map((r) => ({ month: r.month, count: Number(r.count) })),
    todayCount,
    thisWeekCount,
    noShowRate,
    topServices,
    estimatedRevenue: Number(revenueRaw[0]?.revenue ?? 0),
    plan: tenant.plan,
    doctorCount: doctors.length,
    doctorLimit: tenant.plan === "FREE" ? FREE_DOCTOR_LIMIT : null,
    appointmentsThisMonth,
    appointmentMonthlyLimit: tenant.plan === "FREE" ? FREE_MONTHLY_APPOINTMENT_LIMIT : null,
  };
}
