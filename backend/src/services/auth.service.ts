import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
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
import { seedDefaultNotificationPreferences, sendEmail } from "./notification.service";

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function issueTokens(user: { id: string; role: any; name: string; tokenVersion: number }) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, name: user.name });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new BadRequestError("An account with this email already exists");
  }

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

  const tokens = issueTokens(user);
  return { user, ...tokens };
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
  return { user, ...tokens };
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
  return { user, ...tokens };
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
  return { user: updated, ...tokens };
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
