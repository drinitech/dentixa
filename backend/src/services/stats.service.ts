import { prisma } from "../lib/prisma";
import { getTenantId } from "../lib/tenantContext";

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day; // Sunday as week start
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
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
  const [totalAppointments, byStatusRaw, perDoctorRaw, monthlyTrendRaw] = await Promise.all([
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

  return {
    totalAppointments,
    byStatus: Object.fromEntries(byStatusRaw.map((r) => [r.status, r._count._all])),
    perDoctor,
    monthlyTrend: monthlyTrendRaw.map((r) => ({ month: r.month, count: Number(r.count) })),
  };
}
