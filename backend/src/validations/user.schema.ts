import { z } from "zod";

export const updateNotificationPreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        channel: z.enum(["EMAIL", "SMS"]),
        eventType: z.enum(["APPOINTMENT_CREATED", "APPOINTMENT_APPROVED", "APPOINTMENT_REJECTED", "REMINDER"]),
        enabled: z.boolean(),
      }),
    )
    .min(1)
    .max(20),
});
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

export const updateAvatarSchema = z.object({
  avatarUrl: z
    .string()
    .max(2_000_000, "Image is too large")
    .refine((v) => /^data:image\/(png|jpeg|jpg|webp);base64,/.test(v), "Must be a PNG, JPEG, or WEBP image"),
});
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;

export const updateSpecialtySchema = z.object({
  specialty: z.string().trim().min(2).max(100).nullable(),
});
export type UpdateSpecialtyInput = z.infer<typeof updateSpecialtySchema>;
