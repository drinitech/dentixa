import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { BadRequestError } from "../errors/BadRequestError";
import { seedDefaultNotificationPreferences } from "./notification.service";
import type { CreateDoctorInput, UpdateDoctorInput, ListUsersQuery } from "../validations/admin.schema";

const SALT_ROUNDS = 12;

// Never select passwordHash (or tokenVersion) into anything returned to the frontend.
const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatarUrl: true,
  specialty: true,
  isActive: true,
  createdAt: true,
  clinicId: true,
  clinic: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export async function createDoctor(input: CreateDoctorInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new BadRequestError("An account with this email already exists");

  const clinic = await prisma.clinic.findUnique({ where: { id: input.clinicId } });
  if (!clinic) throw new BadRequestError("Selected clinic does not exist");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const doctor = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
      specialty: input.specialty,
      clinicId: input.clinicId,
      role: "DOCTOR",
    },
    select: PUBLIC_USER_SELECT,
  });
  await seedDefaultNotificationPreferences(doctor.id);
  return doctor;
}

export async function listDoctors() {
  return prisma.user.findMany({
    where: { role: "DOCTOR" },
    orderBy: { name: "asc" },
    select: PUBLIC_USER_SELECT,
  });
}

export async function updateDoctor(id: string, input: UpdateDoctorInput) {
  const doctor = await prisma.user.findUnique({ where: { id } });
  if (!doctor || doctor.role !== "DOCTOR") throw new NotFoundError("Doctor not found");

  if (input.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== id) {
      throw new BadRequestError("An account with this email already exists");
    }
  }

  if (input.clinicId) {
    const clinic = await prisma.clinic.findUnique({ where: { id: input.clinicId } });
    if (!clinic) throw new BadRequestError("Selected clinic does not exist");
  }

  return prisma.user.update({
    where: { id },
    data: {
      ...input,
      // Deactivating a doctor must also invalidate any refresh tokens already issued to them.
      ...(input.isActive === false ? { tokenVersion: { increment: 1 } } : {}),
    },
    select: PUBLIC_USER_SELECT,
  });
}

export async function getDoctorServices(doctorId: string) {
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    include: { offeredServices: { select: { id: true } } },
  });
  if (!doctor || doctor.role !== "DOCTOR") throw new NotFoundError("Doctor not found");
  return doctor.offeredServices.map((s) => s.id);
}

// Replace-all semantics, same pattern as replaceSchedule — empty array means
// "no restriction" (bookable for every active service), not "offers nothing".
export async function setDoctorServices(doctorId: string, serviceIds: string[]) {
  const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
  if (!doctor || doctor.role !== "DOCTOR") throw new NotFoundError("Doctor not found");

  await prisma.user.update({
    where: { id: doctorId },
    data: { offeredServices: { set: serviceIds.map((id) => ({ id })) } },
  });
  return serviceIds;
}

export async function listUsers(query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = {};
  if (query.role) where.role = query.role;
  if (query.status) where.isActive = query.status === "active";
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: PUBLIC_USER_SELECT,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page: query.page, pageSize: query.pageSize };
}

export async function setUserActive(id: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");
  if (user.role === "ADMIN") throw new BadRequestError("Cannot ban an admin account");

  return prisma.user.update({
    where: { id },
    data: { isActive, tokenVersion: { increment: 1 } },
    select: PUBLIC_USER_SELECT,
  });
}

// Permanently removes the user. Cascades (schema-level onDelete: Cascade) to
// their appointments (as patient or doctor), doctor schedule, and notification
// preferences — irreversible, so the frontend must confirm before calling this.
export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");
  if (user.role === "ADMIN") throw new BadRequestError("Cannot delete an admin account");

  await prisma.user.delete({ where: { id } });
}

// Admin-set temporary password, returned once in the response for the admin
// to relay to the user (no email reset-link flow in this phase).
export async function resetPassword(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  return { tempPassword };
}
