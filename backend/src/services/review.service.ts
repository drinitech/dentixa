import { prisma } from "../lib/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { ForbiddenError } from "../errors/ForbiddenError";
import { ConflictError } from "../errors/ConflictError";
import type { CreateReviewInput } from "../validations/review.schema";

export async function createReview(appointmentId: string, patientId: string, input: CreateReviewInput) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) throw new NotFoundError("Appointment not found");
  if (appt.patientId !== patientId) throw new ForbiddenError();
  if (appt.status !== "DONE") throw new ConflictError("Only completed appointments can be reviewed");

  const existing = await prisma.review.findUnique({ where: { appointmentId } });
  if (existing) throw new ConflictError("This appointment has already been reviewed");

  return prisma.review.create({
    data: {
      appointmentId,
      patientId,
      doctorId: appt.doctorId,
      rating: input.rating,
      comment: input.comment,
    },
  });
}

export async function listDoctorReviews(doctorId: string) {
  const [reviews, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { doctorId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { patient: { select: { id: true, name: true } } },
    }),
    prisma.review.aggregate({ where: { doctorId }, _avg: { rating: true }, _count: { _all: true } }),
  ]);

  return {
    reviews,
    averageRating: aggregate._avg.rating,
    reviewCount: aggregate._count._all,
  };
}
