import { z } from "zod";

export const createScheduleSchema = z.object({
  teamId: z.string().uuid(),
  date: z.string().datetime(),
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  votingDeadline: z.string().datetime().optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
