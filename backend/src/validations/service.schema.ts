import { z } from "zod";

export const clinicServiceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  durationMinutes: z.number().int().min(5).max(480),
  price: z.number().nonnegative().optional(),
});
export type ClinicServiceInput = z.infer<typeof clinicServiceSchema>;

export const updateClinicServiceSchema = clinicServiceSchema.partial();

export const listServicesQuerySchema = z.object({
  doctorId: z.string().min(1).optional(),
});
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;

export const setDoctorServicesSchema = z.object({
  serviceIds: z.array(z.string().min(1)).max(100),
});
export type SetDoctorServicesInput = z.infer<typeof setDoctorServicesSchema>;
