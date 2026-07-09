import { prisma } from "../lib/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import type { CreateClinicInput, UpdateClinicInput } from "../validations/clinic.schema";

export async function listAllClinics() {
  return prisma.clinic.findMany({ orderBy: { name: "asc" } });
}

export async function listActiveClinics() {
  return prisma.clinic.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function createClinic(input: CreateClinicInput) {
  return prisma.clinic.create({ data: input });
}

export async function updateClinic(id: string, input: UpdateClinicInput) {
  const existing = await prisma.clinic.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Clinic not found");
  return prisma.clinic.update({ where: { id }, data: input });
}
