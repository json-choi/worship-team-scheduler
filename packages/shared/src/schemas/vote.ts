import { z } from "zod";

export const castVoteSchema = z.object({
  scheduleId: z.string().uuid(),
  availability: z.enum(["available", "unavailable", "maybe"]),
});

export const updateVoteSchema = z.object({
  availability: z.enum(["available", "unavailable", "maybe"]),
});

export const voteQuerySchema = z.object({
  scheduleId: z.string().uuid(),
});

export type CastVoteInput = z.infer<typeof castVoteSchema>;
export type UpdateVoteInput = z.infer<typeof updateVoteSchema>;
export type VoteQueryInput = z.infer<typeof voteQuerySchema>;
