import { prisma } from "../lib/prisma";

export async function listActiveDoctors() {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR", isActive: true },
    select: { id: true, name: true, email: true, avatarUrl: true },
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
