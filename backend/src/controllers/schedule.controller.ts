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

export const listExceptionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const exceptions = await scheduleService.listExceptions(req.user!.id);
  res.json({ exceptions });
});

export const createExceptionHandler = asyncHandler(async (req: Request, res: Response) => {
  const exception = await scheduleService.addException(req.user!.id, req.body);
  res.status(201).json({ exception });
});

export const deleteExceptionHandler = asyncHandler(async (req: Request, res: Response) => {
  await scheduleService.removeException(req.user!.id, req.params.id);
  res.status(204).send();
});
