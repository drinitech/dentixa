import { prisma } from "../lib/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { getTenantId } from "../lib/tenantContext";
import type { CreateLocationInput, UpdateLocationInput } from "../validations/location.schema";

export async function listAllLocations() {
  return prisma.location.findMany({ orderBy: { name: "asc" } });
}

export async function listActiveLocations() {
  return prisma.location.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function createLocation(input: CreateLocationInput) {
  return prisma.location.create({ data: { ...input, tenantId: getTenantId() } });
}

export async function updateLocation(id: string, input: UpdateLocationInput) {
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Location not found");
  return prisma.location.update({ where: { id }, data: input });
}
