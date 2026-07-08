import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { BadRequestError } from "../errors/BadRequestError";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import type { RegisterInput, LoginInput } from "../validations/auth.schema";
import { seedDefaultNotificationPreferences } from "./notification.service";

const SALT_ROUNDS = 12;

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
