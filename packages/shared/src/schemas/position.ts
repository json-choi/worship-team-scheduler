import { z } from "zod";

export const createPositionSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1).max(30),
  sortOrder: z.number().int().min(0).optional(),
  minRequired: z.number().int().min(0).default(1),
  maxRequired: z.number().int().min(0).default(1),
  icon: z.string().max(30).optional(),
  color: z.string().max(10).optional(),
});

export const updatePositionSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  sortOrder: z.number().int().min(0).optional(),
  minRequired: z.number().int().min(0).optional(),
  maxRequired: z.number().int().min(0).optional(),
  icon: z.string().max(30).optional(),
  color: z.string().max(10).optional(),
});

export const reorderPositionsSchema = z.object({
  positions: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    }),
  ),
});

export type CreatePositionInput = z.infer<typeof createPositionSchema>;
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
export type ReorderPositionsInput = z.infer<typeof reorderPositionsSchema>;
