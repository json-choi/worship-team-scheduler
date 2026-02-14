import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  schedulePattern: z
    .object({
      dayOfWeek: z.number().min(0).max(6),
      timeStart: z.string(),
      timeEnd: z.string(),
    })
    .optional(),
  settings: z
    .object({
      maxConsecutiveWeeks: z.number().min(1).max(10).optional(),
      votingDeadlineDays: z.number().min(1).max(30).optional(),
      allowMultiplePositions: z.boolean().optional(),
    })
    .optional(),
});

export const joinTeamSchema = z.object({
  inviteCode: z.string().min(1).max(20),
  positions: z.array(z.string().uuid()).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type JoinTeamInput = z.infer<typeof joinTeamSchema>;
