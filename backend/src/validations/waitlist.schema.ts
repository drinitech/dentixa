import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const joinWaitlistSchema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(dateRegex, "date must be YYYY-MM-DD"),
});
export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;
