import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { parseDurationMs } from "../lib/duration";
import * as authService from "../services/auth.service";
import { prisma } from "../lib/prisma";
import { UnauthorizedError } from "../errors/UnauthorizedError";

const REFRESH_COOKIE_NAME = "dentixa_refresh";

function setRefreshCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    // Vercel (frontend) and Render (backend) are different domains, so the
    // cookie must be SameSite=None to be sent cross-site. That requires
    // Secure, which only holds in production (HTTPS) — see errorHandler note
    // in README about local dev behavior.
    sameSite: isProd ? "none" : "lax",
    maxAge: parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN || "7d"),
    path: "/api/auth",
  });
}

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatarUrl?: string | null;
  specialty?: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl ?? null,
    specialty: user.specialty ?? null,
  };
}

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user: serializeUser(user), accessToken });
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ user: serializeUser(user), accessToken });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw new UnauthorizedError("No refresh token provided");

  const { user, accessToken, refreshToken } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  res.json({ user: serializeUser(user), accessToken });
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  res.status(204).send();
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  res.json({ user: serializeUser(user) });
});

export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.changePassword(req.user!.id, req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ user: serializeUser(user), accessToken });
});

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.requestPasswordReset(req.body);
  res.json({ message: "If an account exists for that email, a reset link has been sent." });
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);
  res.status(204).send();
});
