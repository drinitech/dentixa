import { z } from "zod";

export const clinicServiceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  durationMinutes: z.number().int().min(5).max(480),
  price: z.number().nonnegative().optional(),
});
export type ClinicServiceInput = z.infer<typeof clinicServiceSchema>;

export const updateClinicServiceSchema = clinicServiceSchema.partial();
