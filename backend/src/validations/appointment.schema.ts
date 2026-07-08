import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(dateRegex, "date must be YYYY-MM-DD"),
  time: z.string().regex(timeRegex, "time must be HH:mm"),
  reason: z.string().trim().max(500).optional(),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const rejectAppointmentSchema = z.object({
  rejectionReason: z.string().trim().max(500).optional(),
});
export type RejectAppointmentInput = z.infer<typeof rejectAppointmentSchema>;

export const listAppointmentsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "DONE", "NO_SHOW"]).optional(),
  from: z.string().regex(dateRegex).optional(),
  to: z.string().regex(dateRegex).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

// Admin's global view additionally allows filtering by doctor.
export const adminListAppointmentsQuerySchema = listAppointmentsQuerySchema.extend({
  doctorId: z.string().min(1).optional(),
});
export type AdminListAppointmentsQuery = z.infer<typeof adminListAppointmentsQuerySchema>;
