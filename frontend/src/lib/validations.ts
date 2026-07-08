import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().trim().optional().or(z.literal("")),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1, "Choose a doctor"),
  serviceId: z.string().min(1, "Choose a service"),
  date: z.string().min(1, "Choose a date"),
  time: z.string().min(1, "Choose a time"),
  reason: z.string().max(500).optional().or(z.literal("")),
});
export type CreateAppointmentFormInput = z.infer<typeof createAppointmentSchema>;

// Kept as plain strings (matching what native number inputs hand back via
// react-hook-form's uncontrolled register) — parsed to numbers on submit,
// which avoids the input/output generic mismatch z.coerce causes with RHF.
export const clinicServiceSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  durationMinutes: z
    .string()
    .min(1, "Required")
    .refine((v) => Number(v) >= 5 && Number(v) <= 480, "Must be between 5 and 480 minutes"),
  price: z
    .string()
    .optional()
    .refine((v) => !v || Number(v) >= 0, "Must be a positive number"),
});
export type ClinicServiceFormInput = z.infer<typeof clinicServiceSchema>;

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().trim().optional().or(z.literal("")),
  specialty: z.string().trim().optional().or(z.literal("")),
});
export type CreateDoctorFormInput = z.infer<typeof createDoctorSchema>;

export const editDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().optional().or(z.literal("")),
  specialty: z.string().trim().optional().or(z.literal("")),
});
export type EditDoctorFormInput = z.infer<typeof editDoctorSchema>;
