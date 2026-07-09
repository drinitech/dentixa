import { z } from "zod";

export const createClinicHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  reason: z.string().trim().max(200).optional(),
  // Omitted/null = applies to every clinic (e.g. a national holiday).
  clinicId: z.string().min(1).optional(),
});
export type CreateClinicHolidayInput = z.infer<typeof createClinicHolidaySchema>;

export const listClinicHolidaysQuerySchema = z.object({
  clinicId: z.string().min(1).optional(),
});
export type ListClinicHolidaysQuery = z.infer<typeof listClinicHolidaysQuerySchema>;
