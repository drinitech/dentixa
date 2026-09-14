import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { MembershipRole } from "@prisma/client";
import { prisma, prismaUnscoped } from "../lib/prisma";
import { getTenantId } from "../lib/tenantContext";
import { BadRequestError } from "../errors/BadRequestError";
import { ConflictError } from "../errors/ConflictError";
import { NotFoundError } from "../errors/NotFoundError";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import type { CreateInviteInput, AcceptInviteInput } from "../validations/invite.schema";
import { seedDefaultNotificationPreferences, sendEmail } from "./notification.service";
import { issueTokens, getPrimaryTenantSlug } from "./auth.service";
import { logAudit } from "./auditLog.service";

const SALT_ROUNDS = 12;
const INVITE_TOKEN_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createInvite(tenantId: string, invitedByUserId: string, input: CreateInviteInput) {
  const existingUser = await prismaUnscoped.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    const existingMembership = await prismaUnscoped.membership.findUnique({
      where: { userId_tenantId: { userId: existingUser.id, tenantId } },
    });
    if (existingMembership && existingMembership.status === "ACTIVE") {
      throw new ConflictError("This person is already a member of this clinic");
    }
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

  // One pending invite per email per tenant — resending replaces the
  // previous token/expiry rather than piling up duplicate rows.
  const existingInvite = await prisma.invite.findFirst({
    where: { email: input.email, status: "PENDING" },
  });
  const invite = existingInvite
    ? await prisma.invite.update({
        where: { id: existingInvite.id },
        data: { role: input.role, tokenHash, expiresAt, invitedByUserId },
      })
    : await prisma.invite.create({
        data: { tenantId: getTenantId(), email: input.email, role: input.role, tokenHash, expiresAt, invitedByUserId },
      });

  const tenant = await prismaUnscoped.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const inviteUrl = `${process.env.FRONTEND_ORIGIN}/invite/${token}`;
  await sendEmail(
    input.email,
    `You've been invited to join ${tenant.name} on Dentixa`,
    `<p>You've been invited to join <strong>${tenant.name}</strong> as ${input.role.toLowerCase()}.</p><p><a href="${inviteUrl}">${inviteUrl}</a></p><p>This invite expires in 72 hours.</p>`,
  );

  await logAudit({
    tenantId,
    actorUserId: invitedByUserId,
    action: existingInvite ? "invite.resent" : "invite.created",
    entity: "Invite",
    entityId: invite.id,
    meta: { email: input.email, role: input.role },
  });

  return invite;
}

export async function listInvites(tenantId: string) {
  return prisma.invite.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvite(tenantId: string, id: string, actorUserId: string) {
  const invite = await prisma.invite.findUnique({ where: { id } });
  if (!invite || invite.tenantId !== tenantId) throw new NotFoundError("Invite not found");
  if (invite.status !== "PENDING") throw new BadRequestError("Only a pending invite can be revoked");

  await prisma.invite.update({ where: { id }, data: { status: "REVOKED" } });
  await logAudit({
    tenantId,
    actorUserId,
    action: "invite.revoked",
    entity: "Invite",
    entityId: id,
    meta: { email: invite.email, role: invite.role },
  });
}

async function loadPendingInvite(token: string) {
  const invite = await prismaUnscoped.invite.findUnique({ where: { tokenHash: hashInviteToken(token) } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    throw new BadRequestError("This invite is invalid or has expired");
  }
  return invite;
}

export async function getInvitePreview(token: string) {
  const invite = await loadPendingInvite(token);
  const [tenant, existingUser] = await Promise.all([
    prismaUnscoped.tenant.findUniqueOrThrow({ where: { id: invite.tenantId } }),
    prismaUnscoped.user.findUnique({ where: { email: invite.email } }),
  ]);
  return {
    email: invite.email,
    role: invite.role,
    clinicName: tenant.name,
    existingAccount: !!existingUser,
  };
}

export async function acceptInvite(token: string, input: AcceptInviteInput) {
  const invite = await loadPendingInvite(token);
  const existingUser = await prismaUnscoped.user.findUnique({ where: { email: invite.email } });

  const user = existingUser
    ? await acceptAsExistingUser(existingUser, invite.tenantId, invite.role, input.password)
    : await acceptAsNewUser(invite.email, invite.role, invite.tenantId, input);

  await prismaUnscoped.invite.update({ where: { id: invite.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
  await logAudit({
    tenantId: invite.tenantId,
    actorUserId: user.id,
    action: "invite.accepted",
    entity: "Membership",
    entityId: user.id,
    meta: { email: invite.email, role: invite.role },
  });

  const tokens = issueTokens(user);
  const tenantSlug = await getPrimaryTenantSlug(user.id);
  return { user, tenantSlug, ...tokens };
}

async function acceptAsExistingUser(
  user: { id: string; passwordHash: string },
  tenantId: string,
  role: MembershipRole,
  password: string,
) {
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Incorrect password for this account");

  const existingMembership = await prismaUnscoped.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (existingMembership?.status === "ACTIVE") {
    throw new ConflictError("You are already a member of this clinic");
  }

  if (existingMembership) {
    // Re-accepting after being removed (status DISABLED) re-activates the
    // same Membership row rather than creating a second one.
    await prismaUnscoped.membership.update({
      where: { id: existingMembership.id },
      data: { role, status: "ACTIVE" },
    });
  } else {
    await prismaUnscoped.membership.create({ data: { userId: user.id, tenantId, role } });
  }

  return prismaUnscoped.user.findUniqueOrThrow({ where: { id: user.id } });
}

// Legacy global role, kept in sync only for display/JWT purposes — every
// permission check reads MembershipRole from the resolved tenant (see
// middleware/authorize.ts), never this field.
function legacyRoleFor(role: MembershipRole) {
  if (role === "DOCTOR") return "DOCTOR" as const;
  if (role === "PATIENT") return "PATIENT" as const;
  return "ADMIN" as const;
}

async function acceptAsNewUser(
  email: string,
  role: MembershipRole,
  tenantId: string,
  input: AcceptInviteInput,
) {
  if (!input.name) throw new BadRequestError("Name is required");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prismaUnscoped.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name!, email, passwordHash, role: legacyRoleFor(role) },
    });
    await tx.membership.create({ data: { userId: user.id, tenantId, role } });
    return user;
  });

  await seedDefaultNotificationPreferences(user.id);
  return user;
}
