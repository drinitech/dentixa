import { z } from "zod";

export const createClinicHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  reason: z.string().trim().max(200).optional(),
});
export type CreateClinicHolidayInput = z.infer<typeof createClinicHolidaySchema>;
