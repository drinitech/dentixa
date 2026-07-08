import { prisma } from "../lib/prisma";

export async function listActiveDoctors() {
  return prisma.user.findMany({
    where: { role: "DOCTOR", isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}
