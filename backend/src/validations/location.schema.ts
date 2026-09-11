import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().max(200).optional(),
  phone: z.string().trim().min(6).max(20).optional(),
});
export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  address: z.string().trim().max(200).optional(),
  phone: z.string().trim().min(6).max(20).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
