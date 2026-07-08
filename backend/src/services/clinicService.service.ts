import { prisma } from "../lib/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import type { ClinicServiceInput } from "../validations/service.schema";

export async function listActiveServices() {
  return prisma.clinicService.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function listAllServices() {
  return prisma.clinicService.findMany({ orderBy: { name: "asc" } });
}

export async function createService(input: ClinicServiceInput) {
  return prisma.clinicService.create({ data: input });
}

export async function updateService(id: string, input: Partial<ClinicServiceInput>) {
  const existing = await prisma.clinicService.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Service not found");
  return prisma.clinicService.update({ where: { id }, data: input });
}

export async function deactivateService(id: string) {
  const existing = await prisma.clinicService.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Service not found");
  return prisma.clinicService.update({ where: { id }, data: { isActive: false } });
}
