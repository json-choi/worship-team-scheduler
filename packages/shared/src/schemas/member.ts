import { z } from "zod";

export const updateMemberSchema = z.object({
  role: z.enum(["admin", "member"]).optional(),
  positions: z.array(z.string().uuid()).optional(),
  status: z.enum(["pending", "active", "inactive"]).optional(),
});

export const approveMemberSchema = z.object({
  memberId: z.string().uuid(),
  approved: z.boolean(),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ApproveMemberInput = z.infer<typeof approveMemberSchema>;
