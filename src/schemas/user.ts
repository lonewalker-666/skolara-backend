import { z } from "zod";

export const updateUserProfileSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(10).max(10),
  gender: z.enum(["Male", "Female", "Others"]).nullable(),
  dob: z.date().nullable(),
});
