import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as scheduleService from "../services/schedule.service";
import { getFreeSlots } from "../services/slot.service";

export const getMyScheduleHandler = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await scheduleService.getSchedule(req.user!.id);
  res.json({ schedule });
});

export const replaceMyScheduleHandler = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await scheduleService.replaceSchedule(req.user!.id, req.body);
  res.json({ schedule });
});

export const slotsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { doctorId, date, serviceId } = req.query as { doctorId: string; date: string; serviceId: string };
  const slots = await getFreeSlots(doctorId, date, serviceId);
  res.json({ slots });
});
