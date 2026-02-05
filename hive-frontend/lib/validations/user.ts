// hive-frontend/lib/validations/user.ts

import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal('')),
  roles: z.array(z.string()).default([]),
  avatar: z.any().optional(),
});

export type UserFormData = z.infer<typeof userSchema>;