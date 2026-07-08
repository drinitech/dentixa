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
