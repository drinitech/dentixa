import { z } from "zod";

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  phone: z.string().trim().min(6).max(20).optional(),
  specialty: z.string().trim().min(2).max(100).optional(),
  clinicId: z.string().min(1),
});
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;

export const updateDoctorSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().min(6).max(20).optional(),
  specialty: z.string().trim().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  clinicId: z.string().min(1).optional(),
});
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;

export const listUsersQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
