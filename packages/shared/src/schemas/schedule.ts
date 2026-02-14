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

export const updateScheduleSchema = z.object({
  date: z.string().datetime().optional(),
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["draft", "voting", "closed", "confirmed"]).optional(),
  votingDeadline: z.string().datetime().optional(),
});

export const batchCreateSchedulesSchema = z.object({
  teamId: z.string().uuid(),
  dates: z.array(z.string().datetime()).min(1),
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
  titlePrefix: z.string().min(1).max(80).default("주일예배"),
  votingDeadline: z.string().datetime().optional(),
  status: z.enum(["draft", "voting"]).default("draft"),
});

export const scheduleQuerySchema = z.object({
  teamId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type BatchCreateSchedulesInput = z.infer<typeof batchCreateSchedulesSchema>;
export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;
