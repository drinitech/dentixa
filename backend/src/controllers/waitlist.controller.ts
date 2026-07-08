import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as waitlistService from "../services/waitlist.service";

export const joinWaitlistHandler = asyncHandler(async (req: Request, res: Response) => {
  const entry = await waitlistService.joinWaitlist(req.user!.id, req.body);
  res.status(201).json({ entry });
});

export const listMyWaitlistHandler = asyncHandler(async (req: Request, res: Response) => {
  const entries = await waitlistService.listMyWaitlist(req.user!.id);
  res.json({ entries });
});

export const leaveWaitlistHandler = asyncHandler(async (req: Request, res: Response) => {
  await waitlistService.leaveWaitlist(req.user!.id, req.params.id);
  res.status(204).send();
});
