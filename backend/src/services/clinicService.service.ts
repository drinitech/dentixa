import { prisma } from "../lib/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { getTenantId } from "../lib/tenantContext";
import type { ClinicServiceInput } from "../validations/service.schema";

export async function listActiveServices(doctorId?: string) {
  if (!doctorId) {
    return prisma.clinicService.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  }

  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    include: { offeredServices: { select: { id: true } } },
  });
  if (!doctor) throw new NotFoundError("Doctor not found");

  // Empty offeredServices means the doctor hasn't opted into a restricted
  // list — they're bookable for every active service.
  if (doctor.offeredServices.length === 0) {
    return prisma.clinicService.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  }

  return prisma.clinicService.findMany({
    where: { isActive: true, id: { in: doctor.offeredServices.map((s) => s.id) } },
    orderBy: { name: "asc" },
  });
}

export async function listAllServices() {
  return prisma.clinicService.findMany({ orderBy: { name: "asc" } });
}

export async function createService(input: ClinicServiceInput) {
  return prisma.clinicService.create({ data: { ...input, tenantId: getTenantId() } });
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
