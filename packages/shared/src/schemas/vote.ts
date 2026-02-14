import { z } from "zod";

export const castVoteSchema = z.object({
  scheduleId: z.string().uuid(),
  availability: z.enum(["available", "unavailable", "maybe"]),
});

export type CastVoteInput = z.infer<typeof castVoteSchema>;
