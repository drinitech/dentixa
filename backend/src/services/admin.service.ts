import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma, type MembershipRole } from "@prisma/client";
import { prisma, prismaUnscoped } from "../lib/prisma";
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
  locationId: true,
  location: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

// Membership isn't tenant-scoped by the Prisma extension (it's how tenant
// context gets established in the first place), so every lookup here filters
// by tenantId explicitly. Throws NotFoundError (never Forbidden) for a user
// who exists globally but isn't a member of this tenant — an owner in
// tenant A must get the same 404 for tenant B's user whether that user
// exists at all or not.
async function requireMembership(tenantId: string, userId: string, role?: MembershipRole) {
  const membership = await prismaUnscoped.membership.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
  });
  if (!membership || membership.status !== "ACTIVE" || (role && membership.role !== role)) {
    throw new NotFoundError("User not found");
  }
  return membership;
}

export async function createDoctor(tenantId: string, input: CreateDoctorInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new BadRequestError("An account with this email already exists");

  // Tenant-scoped by the extension — resolves to null if input.locationId
  // belongs to a different tenant, same as "doesn't exist".
  const location = await prisma.location.findUnique({ where: { id: input.locationId } });
  if (!location) throw new BadRequestError("Selected location does not exist");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const doctor = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
      specialty: input.specialty,
      locationId: input.locationId,
      role: "DOCTOR",
    },
    select: PUBLIC_USER_SELECT,
  });
  await seedDefaultNotificationPreferences(doctor.id);
  await prismaUnscoped.membership.create({ data: { userId: doctor.id, tenantId, role: "DOCTOR" } });
  return doctor;
}

export async function listDoctors(tenantId: string) {
  return prisma.user.findMany({
    where: { memberships: { some: { tenantId, role: "DOCTOR" } } },
    orderBy: { name: "asc" },
    select: PUBLIC_USER_SELECT,
  });
}

export async function updateDoctor(tenantId: string, id: string, input: UpdateDoctorInput) {
  await requireMembership(tenantId, id, "DOCTOR");

  if (input.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== id) {
      throw new BadRequestError("An account with this email already exists");
    }
  }

  if (input.locationId) {
    const location = await prisma.location.findUnique({ where: { id: input.locationId } });
    if (!location) throw new BadRequestError("Selected location does not exist");
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

export async function getDoctorServices(tenantId: string, doctorId: string) {
  await requireMembership(tenantId, doctorId, "DOCTOR");
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    include: { offeredServices: { select: { id: true } } },
  });
  return doctor!.offeredServices.map((s) => s.id);
}

// Replace-all semantics, same pattern as replaceSchedule — empty array means
// "no restriction" (bookable for every active service), not "offers nothing".
export async function setDoctorServices(tenantId: string, doctorId: string, serviceIds: string[]) {
  await requireMembership(tenantId, doctorId, "DOCTOR");

  await prisma.user.update({
    where: { id: doctorId },
    data: { offeredServices: { set: serviceIds.map((id) => ({ id })) } },
  });
  return serviceIds;
}

// Legacy Role (PATIENT/DOCTOR/ADMIN) is what the query param and frontend
// still use; Membership uses OWNER instead of ADMIN.
function toMembershipRole(role: "PATIENT" | "DOCTOR" | "ADMIN"): MembershipRole {
  return role === "ADMIN" ? "OWNER" : role;
}

export async function listUsers(tenantId: string, query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = {
    memberships: { some: { tenantId, ...(query.role ? { role: toMembershipRole(query.role) } : {}) } },
  };
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

export async function setUserActive(tenantId: string, id: string, isActive: boolean) {
  const membership = await requireMembership(tenantId, id);
  if (membership.role === "OWNER") throw new BadRequestError("Cannot ban an owner account");

  return prisma.user.update({
    where: { id },
    data: { isActive, tokenVersion: { increment: 1 } },
    select: PUBLIC_USER_SELECT,
  });
}

// Permanently removes the user. Cascades (schema-level onDelete: Cascade) to
// their appointments (as patient or doctor), doctor schedule, and notification
// preferences — irreversible, so the frontend must confirm before calling this.
//
// Known limitation: User is global, so a person who is also a member of
// another tenant loses that membership and history too, not just this
// tenant's. Deleting only this tenant's Membership (leaving the User intact)
// would be the safer behavior once cross-tenant shared accounts are common;
// today, with a single real tenant, this matches the pre-multi-tenant
// behavior exactly.
export async function deleteUser(tenantId: string, id: string) {
  const membership = await requireMembership(tenantId, id);
  if (membership.role === "OWNER") throw new BadRequestError("Cannot delete an owner account");

  await prisma.user.delete({ where: { id } });
}

// Admin-set temporary password, returned once in the response for the admin
// to relay to the user (no email reset-link flow in this phase).
export async function resetPassword(tenantId: string, id: string) {
  await requireMembership(tenantId, id);

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  return { tempPassword };
}
