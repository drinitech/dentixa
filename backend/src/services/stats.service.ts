import { prisma } from "../lib/prisma";

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

export async function getAdminStats() {
  const [totalAppointments, byStatusRaw, perDoctorRaw, monthlyTrendRaw] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.appointment.groupBy({ by: ["doctorId", "status"], _count: { _all: true } }),
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char(date_trunc('month', "date"), 'YYYY-MM') AS month, COUNT(*)::bigint AS count
      FROM "Appointment"
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 12
    `,
  ]);

  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
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
