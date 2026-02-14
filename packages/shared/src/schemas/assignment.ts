import { z } from "zod";

export const autoAssignSchema = z.object({
  scheduleId: z.string().uuid(),
});

export const updateAssignmentSchema = z.object({
  userId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  status: z.enum(["auto", "manual", "confirmed"]).optional(),
});

export const confirmAssignmentsSchema = z.object({
  scheduleId: z.string().uuid(),
});

export const assignmentQuerySchema = z.object({
  scheduleId: z.string().uuid(),
});

export type AutoAssignInput = z.infer<typeof autoAssignSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type ConfirmAssignmentsInput = z.infer<typeof confirmAssignmentsSchema>;
export type AssignmentQueryInput = z.infer<typeof assignmentQuerySchema>;
