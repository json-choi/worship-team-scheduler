import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export const onboardingSchema = z.object({
  name: z.string().min(1).max(50),
  phone: z.string().max(20).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
