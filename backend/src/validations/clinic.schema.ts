import { z } from "zod";

export const createClinicSchema = z.object({
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().max(200).optional(),
  phone: z.string().trim().min(6).max(20).optional(),
});
export type CreateClinicInput = z.infer<typeof createClinicSchema>;

export const updateClinicSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  address: z.string().trim().max(200).optional(),
  phone: z.string().trim().min(6).max(20).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>;
