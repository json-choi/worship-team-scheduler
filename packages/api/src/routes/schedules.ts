import { Hono } from "hono";
import { z } from "zod";
import { eq, and, gte, lt } from "drizzle-orm";
import { schedules, teamMembers, notifications } from "@wts/db";
import {
  createScheduleSchema,
  updateScheduleSchema,
  batchCreateSchedulesSchema,
  scheduleQuerySchema,
} from "@wts/shared";
import { getDb } from "../lib/supabase";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import {
  jsonValidator,
  paramValidator,
  queryValidator,
} from "../middleware/validate";

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

const idParamSchema = z.object({ id: z.string().uuid() });

app.get("/", queryValidator(scheduleQuerySchema), async (c) => {
  const { teamId, month } = c.req.valid("query");
  const db = getDb();

  let query = db.select().from(schedules).where(eq(schedules.teamId, teamId));

  if (month) {
    const startDate = new Date(`${month}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    query = db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.teamId, teamId),
          gte(schedules.date, startDate),
          lt(schedules.date, endDate),
        ),
      );
  }

  const results = await query.orderBy(schedules.date);

  return c.json({ data: results, error: null });
});

app.post("/", jsonValidator(createScheduleSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = getDb();

  if (!(await requireAdmin(body.teamId, userId))) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  const [schedule] = await db
    .insert(schedules)
    .values({
      teamId: body.teamId,
      date: new Date(body.date),
      timeStart: body.timeStart,
      timeEnd: body.timeEnd,
      title: body.title,
      description: body.description,
      votingDeadline: body.votingDeadline
        ? new Date(body.votingDeadline)
        : null,
      createdBy: userId,
    })
    .returning();

  return c.json({ data: schedule, error: null }, 201);
});

app.post("/batch", jsonValidator(batchCreateSchedulesSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = getDb();

  if (!(await requireAdmin(body.teamId, userId))) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  const values = body.dates.map((dateStr, idx) => ({
    teamId: body.teamId,
    date: new Date(dateStr),
    timeStart: body.timeStart,
    timeEnd: body.timeEnd,
    title: `${body.titlePrefix} (${idx + 1})`,
    status: body.status as "draft" | "voting",
    votingDeadline: body.votingDeadline
      ? new Date(body.votingDeadline)
      : null,
    createdBy: userId,
  }));

  const created = await db.insert(schedules).values(values).returning();

  if (body.status === "voting") {
    const members = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, body.teamId),
          eq(teamMembers.status, "active"),
        ),
      );

    const notificationValues = members.map((m) => ({
      userId: m.userId,
      type: "schedule_open" as const,
      title: "새 스케줄이 열렸습니다",
      body: `${created.length}개의 일정에 투표해주세요`,
      data: { teamId: body.teamId },
    }));

    if (notificationValues.length > 0) {
      await db.insert(notifications).values(notificationValues);
    }
  }

  return c.json({ data: created, error: null }, 201);
});

app.get("/:id", paramValidator(idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const db = getDb();

  const schedule = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, id))
    .limit(1);

  if (schedule.length === 0) {
    return c.json(
      { data: null, error: { message: "Schedule not found" } },
      404,
    );
  }

  return c.json({ data: schedule[0], error: null });
});

app.patch(
  "/:id",
  paramValidator(idParamSchema),
  jsonValidator(updateScheduleSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json(
        { data: null, error: { message: "Schedule not found" } },
        404,
      );
    }

    if (!(await requireAdmin(existing[0].teamId, userId))) {
      return c.json({ data: null, error: { message: "Not authorized" } }, 403);
    }

    const updateData: Record<string, unknown> = {};
    if (body.date) updateData.date = new Date(body.date);
    if (body.timeStart !== undefined) updateData.timeStart = body.timeStart;
    if (body.timeEnd !== undefined) updateData.timeEnd = body.timeEnd;
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.status) updateData.status = body.status;
    if (body.votingDeadline !== undefined)
      updateData.votingDeadline = body.votingDeadline
        ? new Date(body.votingDeadline)
        : null;

    const [updated] = await db
      .update(schedules)
      .set(updateData)
      .where(eq(schedules.id, id))
      .returning();

    return c.json({ data: updated, error: null });
  },
);

app.delete("/:id", paramValidator(idParamSchema), async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const db = getDb();

  const existing = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, id))
    .limit(1);

  if (existing.length === 0) {
    return c.json(
      { data: null, error: { message: "Schedule not found" } },
      404,
    );
  }

  if (!(await requireAdmin(existing[0].teamId, userId))) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  await db.delete(schedules).where(eq(schedules.id, id));

  return c.json({ data: { success: true }, error: null });
});

export default app;
