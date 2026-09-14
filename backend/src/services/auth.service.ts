import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prismaUnscoped as prisma } from "../lib/prisma";
import { DEFAULT_TENANT_ID } from "../lib/tenant";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { BadRequestError } from "../errors/BadRequestError";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import type {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../validations/auth.schema";
import type { RegisterClinicInput } from "../validations/tenant.schema";
import { seedDefaultNotificationPreferences, sendEmail } from "./notification.service";

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function issueTokens(user: { id: string; role: any; name: string; tokenVersion: number }) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
  return { accessToken, refreshToken };
}

// The frontend doesn't ask "which clinic" at login (there's no multi-clinic
// picker UI yet, and today every user has at most one Membership anyway) —
// it needs this to know which /c/[slug] to land the user in after a global
// login. Picks the oldest active Membership, which is the only one that
// exists for any current user; once one person can belong to several real
// tenants (Milestone 3+), this is the seam where a clinic-picker step goes.
export async function getPrimaryTenantSlug(userId: string): Promise<string | null> {
  const membership = await prisma.membership.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    include: { tenant: { select: { slug: true } } },
  });
  return membership?.tenant.slug ?? null;
}

// /auth/register has no resolveTenant middleware (it runs before the caller
// is authenticated, and resolveTenant needs req.user to check Membership) —
// so the tenant is instead read straight off an optional X-Tenant-Slug
// header, unauthenticated, the same way resolveTenant.ts bootstraps a tenant
// from a slug before any context exists. Reached via /register (no header —
// joins the demo tenant, matching pre-Milestone-3 behavior for the generic
// marketing-page signup) or /c/[slug]/register (TenantProvider always sends
// the header — joins that real clinic). A signup for an email that already
// has an account anywhere is still rejected outright, even at a different
// clinic — joining an *additional* clinic on an existing account is the
// self-service equivalent of accepting an invite (see invite.service.ts's
// acceptInvite for that flow) and isn't exposed from plain registration yet.
async function resolveRegistrationTenantId(slug?: string): Promise<string> {
  if (!slug) return DEFAULT_TENANT_ID;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.status !== "ACTIVE") throw new BadRequestError("Clinic not found");
  return tenant.id;
}

export async function register(input: RegisterInput, tenantSlug?: string) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new BadRequestError("An account with this email already exists");
  }
  const tenantId = await resolveRegistrationTenantId(tenantSlug);

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  // Public registration always creates PATIENT accounts — doctor/admin accounts
  // are provisioned only via /admin/doctors or the initial seed.
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
      role: "PATIENT",
    },
  });

  await seedDefaultNotificationPreferences(user.id);
  await prisma.membership.create({ data: { userId: user.id, tenantId, role: "PATIENT" } });

  const tokens = issueTokens(user);
  const resolvedSlug = await getPrimaryTenantSlug(user.id);
  return { user, tenantSlug: resolvedSlug, ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }
  if (!user.isActive) {
    throw new UnauthorizedError("This account has been deactivated");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = issueTokens(user);
  const tenantSlug = await getPrimaryTenantSlug(user.id);
  return { user, tenantSlug, ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    throw new UnauthorizedError("Session is no longer valid, please log in again");
  }

  const tokens = issueTokens(user);
  const tenantSlug = await getPrimaryTenantSlug(user.id);
  return { user, tenantSlug, ...tokens };
}

// Self-service, from an already-authenticated session. Bumps tokenVersion
// (like any password change) but immediately reissues tokens against the new
// version so the current session keeps working without a forced re-login.
export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError("Session is no longer valid, please log in again");

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) throw new BadRequestError("Current password is incorrect");

  const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  const tokens = issueTokens(updated);
  const tenantSlug = await getPrimaryTenantSlug(updated.id);
  return { user: updated, tenantSlug, ...tokens };
}

// Always resolves the same way regardless of whether the email exists, so the
// endpoint can't be used to enumerate registered accounts.
export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return;

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${process.env.FRONTEND_ORIGIN}/reset-password?token=${token}`;
  await sendEmail(
    user.email,
    "Reset your Dentixa password",
    `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  );
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { passwordResetTokenHash: hashResetToken(input.token) },
  });
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw new BadRequestError("This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });
}

// Public self-service clinic signup (Milestone 3 onboarding): always creates
// a brand-new User + Tenant + Membership(OWNER) together. An existing user
// spinning up an additional clinic under their current account is a future
// seam (would need an authenticated variant that skips the User creation
// step) — out of scope for MVP, which only has one owner-per-clinic signup.
export async function registerClinic(input: RegisterClinicInput) {
  const [existingUser, existingSlug] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.ownerEmail } }),
    prisma.tenant.findUnique({ where: { slug: input.slug } }),
  ]);
  if (existingUser) throw new BadRequestError("An account with this email already exists");
  if (existingSlug) throw new BadRequestError("This clinic URL is already taken");

  const passwordHash = await bcrypt.hash(input.ownerPassword, SALT_ROUNDS);

  const { user, tenant } = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: input.clinicName, slug: input.slug },
    });
    const user = await tx.user.create({
      data: { name: input.ownerName, email: input.ownerEmail, passwordHash, role: "ADMIN" },
    });
    await tx.membership.create({ data: { userId: user.id, tenantId: tenant.id, role: "OWNER" } });
    return { user, tenant };
  });

  await seedDefaultNotificationPreferences(user.id);

  const tokens = issueTokens(user);
  return { user, tenantSlug: tenant.slug, ...tokens };
}
