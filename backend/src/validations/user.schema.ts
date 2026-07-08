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
