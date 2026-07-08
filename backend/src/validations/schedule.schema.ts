import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const scheduleWindowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(timeRegex, "startTime must be HH:mm"),
    endTime: z.string().regex(timeRegex, "endTime must be HH:mm"),
  })
  .refine((w) => w.startTime < w.endTime, {
    message: "startTime must be before endTime",
    path: ["endTime"],
  });

// Replace-all semantics: the doctor submits their full weekly schedule at once.
export const replaceScheduleSchema = z.object({
  windows: z.array(scheduleWindowSchema).max(50),
});
export type ReplaceScheduleInput = z.infer<typeof replaceScheduleSchema>;

export const slotsQuerySchema = z.object({
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  serviceId: z.string().min(1),
});
export type SlotsQueryInput = z.infer<typeof slotsQuerySchema>;

export const createExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  reason: z.string().trim().max(200).optional(),
});
export type CreateExceptionInput = z.infer<typeof createExceptionSchema>;
