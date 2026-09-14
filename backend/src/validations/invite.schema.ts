import { z } from "zod";

export const createInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  role: z.enum(["OWNER", "RECEPTIONIST", "DOCTOR", "PATIENT"]),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

// name/password are only required when the invite email has no existing
// User yet — enforced in invite.service.ts (acceptInvite), since whether an
// account already exists depends on a DB lookup, not on the shape of the
// request body.
export const acceptInviteSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
