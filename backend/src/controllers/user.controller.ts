import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as userService from "../services/user.service";

export const getNotificationPreferencesHandler = asyncHandler(async (req: Request, res: Response) => {
  const preferences = await userService.getNotificationPreferences(req.user!.id);
  res.json({ preferences });
});

export const updateNotificationPreferencesHandler = asyncHandler(async (req: Request, res: Response) => {
  const preferences = await userService.updateNotificationPreferences(req.user!.id, req.body);
  res.json({ preferences });
});

export const updateAvatarHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateAvatar(req.user!.id, req.body.avatarUrl);
  res.json({ user });
});

export const updateSpecialtyHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateSpecialty(req.user!.id, req.body.specialty);
  res.json({ user });
});

export const updateProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.user!.id, req.body);
  res.json({ user });
});
