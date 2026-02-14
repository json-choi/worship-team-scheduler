import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import {
  scheduleAssignments,
  schedules,
  scheduleVotes,
  teamMembers,
  teamPositions,
  notifications,
  users,
} from "@wts/db";
import {
  autoAssignSchema,
  updateAssignmentSchema,
  confirmAssignmentsSchema,
  assignmentQuerySchema,
} from "@wts/shared";
import { getDb } from "../lib/supabase";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import {
  jsonValidator,
  paramValidator,
  queryValidator,
} from "../middleware/validate";
import {
  autoAssign,
  type PositionConfig,
  type MemberVote,
  type ParticipationRecord,
} from "../lib/assignment";

const app = new Hono<AuthEnv>();

app.use(authMiddleware);

async function requireAdmin(teamId: string, userId: string): Promise<boolean> {
  const db = getDb();
  const member = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, "admin"),
      ),
    )
    .limit(1);
  return member.length > 0;
}

app.get("/", queryValidator(assignmentQuerySchema), async (c) => {
  const { scheduleId } = c.req.valid("query");
  const db = getDb();

  const results = await db
    .select({
      assignment: scheduleAssignments,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
      position: {
        id: teamPositions.id,
        name: teamPositions.name,
        icon: teamPositions.icon,
        color: teamPositions.color,
      },
    })
    .from(scheduleAssignments)
    .innerJoin(users, eq(scheduleAssignments.userId, users.id))
    .innerJoin(teamPositions, eq(scheduleAssignments.positionId, teamPositions.id))
    .where(eq(scheduleAssignments.scheduleId, scheduleId));

  return c.json({ data: results, error: null });
});

app.post("/auto", jsonValidator(autoAssignSchema), async (c) => {
  const userId = c.get("userId");
  const { scheduleId } = c.req.valid("json");
  const db = getDb();

  const schedule = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, scheduleId))
    .limit(1);

  if (schedule.length === 0) {
    return c.json(
      { data: null, error: { message: "Schedule not found" } },
      404,
    );
  }

  if (!(await requireAdmin(schedule[0].teamId, userId))) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  const positions = await db
    .select()
    .from(teamPositions)
    .where(eq(teamPositions.teamId, schedule[0].teamId))
    .orderBy(teamPositions.sortOrder);

  const positionConfigs: PositionConfig[] = positions.map((p) => ({
    id: p.id,
    name: p.name,
    minRequired: p.minRequired,
    maxRequired: p.maxRequired,
  }));

  const votes = await db
    .select()
    .from(scheduleVotes)
    .where(eq(scheduleVotes.scheduleId, scheduleId));

  const members = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, schedule[0].teamId),
        eq(teamMembers.status, "active"),
      ),
    );

  const memberVotes: MemberVote[] = votes.map((v) => {
    const member = members.find((m) => m.userId === v.userId);
    return {
      userId: v.userId,
      availability: v.availability,
      positions: (member?.positions as string[]) ?? [],
    };
  });

  const pastAssignments = await db
    .select()
    .from(scheduleAssignments)
    .innerJoin(schedules, eq(scheduleAssignments.scheduleId, schedules.id))
    .where(eq(schedules.teamId, schedule[0].teamId))
    .orderBy(desc(schedules.date));

  const participationMap = new Map<
    string,
    { totalCount: number; lastConsecutiveCount: number }
  >();

  for (const row of pastAssignments) {
    const uid = row.schedule_assignments.userId;
    const existing = participationMap.get(uid) ?? {
      totalCount: 0,
      lastConsecutiveCount: 0,
    };
    existing.totalCount += 1;
    participationMap.set(uid, existing);
  }

  const historyRecords: ParticipationRecord[] = Array.from(
    participationMap.entries(),
  ).map(([uid, data]) => ({
    userId: uid,
    totalCount: data.totalCount,
    lastConsecutiveCount: data.lastConsecutiveCount,
  }));

  const result = autoAssign({
    positions: positionConfigs,
    votes: memberVotes,
    history: historyRecords,
    maxConsecutiveWeeks: 3,
  });

  await db
    .delete(scheduleAssignments)
    .where(eq(scheduleAssignments.scheduleId, scheduleId));

  if (result.assignments.length > 0) {
    const assignmentValues = result.assignments.map((a) => ({
      scheduleId,
      userId: a.userId,
      positionId: a.positionId,
      status: "auto" as const,
    }));

    await db.insert(scheduleAssignments).values(assignmentValues);
  }

  return c.json(
    { data: { assignments: result.assignments, warnings: result.warnings }, error: null },
    201,
  );
});

const idParamSchema = z.object({ id: z.string().uuid() });

app.patch(
  "/:id",
  paramValidator(idParamSchema),
  jsonValidator(updateAssignmentSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(scheduleAssignments)
      .where(eq(scheduleAssignments.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json(
        { data: null, error: { message: "Assignment not found" } },
        404,
      );
    }

    const schedule = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, existing[0].scheduleId))
      .limit(1);

    if (schedule.length === 0) {
      return c.json(
        { data: null, error: { message: "Schedule not found" } },
        404,
      );
    }

    if (!(await requireAdmin(schedule[0].teamId, userId))) {
      return c.json({ data: null, error: { message: "Not authorized" } }, 403);
    }

    const updateData: Record<string, unknown> = { status: "manual" };
    if (body.userId) updateData.userId = body.userId;
    if (body.positionId) updateData.positionId = body.positionId;

    const [updated] = await db
      .update(scheduleAssignments)
      .set(updateData)
      .where(eq(scheduleAssignments.id, id))
      .returning();

    return c.json({ data: updated, error: null });
  },
);

app.post("/confirm", jsonValidator(confirmAssignmentsSchema), async (c) => {
  const userId = c.get("userId");
  const { scheduleId } = c.req.valid("json");
  const db = getDb();

  const schedule = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, scheduleId))
    .limit(1);

  if (schedule.length === 0) {
    return c.json(
      { data: null, error: { message: "Schedule not found" } },
      404,
    );
  }

  if (!(await requireAdmin(schedule[0].teamId, userId))) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  await db
    .update(schedules)
    .set({ status: "confirmed" })
    .where(eq(schedules.id, scheduleId));

  await db
    .update(scheduleAssignments)
    .set({ status: "confirmed" })
    .where(eq(scheduleAssignments.scheduleId, scheduleId));

  const assignments = await db
    .select()
    .from(scheduleAssignments)
    .where(eq(scheduleAssignments.scheduleId, scheduleId));

  const dateStr = new Date(schedule[0].date).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });

  const notificationValues = assignments.map((a) => ({
    userId: a.userId,
    type: "schedule_confirmed" as const,
    title: "일정이 확정되었습니다",
    body: `${dateStr} ${schedule[0].title}에 배정되었습니다`,
    data: { scheduleId, teamId: schedule[0].teamId },
  }));

  if (notificationValues.length > 0) {
    await db.insert(notifications).values(notificationValues);
  }

  return c.json({ data: { success: true }, error: null });
});

export default app;
