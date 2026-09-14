import { z } from "zod";

// Lowercase letters, digits, and single internal hyphens — this is what
// ends up in the public /c/[slug] URL, so no leading/trailing hyphen and no
// repeats.
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug must be at least 3 characters")
  .max(50)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens");

export const registerClinicSchema = z.object({
  clinicName: z.string().trim().min(2, "Clinic name must be at least 2 characters").max(100),
  slug: slugSchema,
  ownerName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  ownerEmail: z.string().trim().toLowerCase().email("Invalid email address"),
  ownerPassword: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type RegisterClinicInput = z.infer<typeof registerClinicSchema>;
