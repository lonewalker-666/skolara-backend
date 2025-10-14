import { z } from "zod";

export const updateUserProfileSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(10).max(10),
  gender: z.enum(["Male", "Female", "Others"]).nullable(),
    // keep as string with YYYY-MM-DD
  dob: z.union([
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .transform((s) => new Date(`${s}T00:00:00.000Z`)),
    z.null(),
  ])
    .nullable()
    .default(null),
});
