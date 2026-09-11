import { prisma } from "../lib/prisma";

export async function listActiveDoctors(tenantId: string, locationId?: string) {
  const doctors = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(locationId ? { locationId } : {}),
      memberships: { some: { tenantId, role: "DOCTOR", status: "ACTIVE" } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      specialty: true,
      locationId: true,
      location: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  // Review is tenant-scoped by the Prisma extension, so this already only
  // aggregates ratings from the current tenant.
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
