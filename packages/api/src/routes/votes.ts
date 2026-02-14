import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { scheduleVotes, schedules, teamMembers, users } from "@wts/db";
import { castVoteSchema, updateVoteSchema, voteQuerySchema } from "@wts/shared";
import { getDb } from "../lib/supabase";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import {
  jsonValidator,
  paramValidator,
  queryValidator,
} from "../middleware/validate";

const app = new Hono<AuthEnv>();

app.use(authMiddleware);

app.get("/", queryValidator(voteQuerySchema), async (c) => {
  const { scheduleId } = c.req.valid("query");
  const db = getDb();

  const votes = await db
    .select({
      vote: scheduleVotes,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(scheduleVotes)
    .innerJoin(users, eq(scheduleVotes.userId, users.id))
    .where(eq(scheduleVotes.scheduleId, scheduleId));

  return c.json({ data: votes, error: null });
});

app.post("/", jsonValidator(castVoteSchema), async (c) => {
  const userId = c.get("userId");
  const { scheduleId, availability } = c.req.valid("json");
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

  if (schedule[0].status !== "voting") {
    return c.json(
      { data: null, error: { message: "Schedule is not open for voting" } },
      400,
    );
  }

  if (
    schedule[0].votingDeadline &&
    new Date() > new Date(schedule[0].votingDeadline)
  ) {
    return c.json(
      { data: null, error: { message: "Voting deadline has passed" } },
      400,
    );
  }

  const member = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, schedule[0].teamId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.status, "active"),
      ),
    )
    .limit(1);

  if (member.length === 0) {
    return c.json(
      { data: null, error: { message: "Not a member of this team" } },
      403,
    );
  }

  const existing = await db
    .select()
    .from(scheduleVotes)
    .where(
      and(
        eq(scheduleVotes.scheduleId, scheduleId),
        eq(scheduleVotes.userId, userId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(scheduleVotes)
      .set({ availability, votedAt: new Date() })
      .where(eq(scheduleVotes.id, existing[0].id))
      .returning();
    return c.json({ data: updated, error: null });
  }

  const [vote] = await db
    .insert(scheduleVotes)
    .values({
      scheduleId,
      userId,
      availability,
    })
    .returning();

  return c.json({ data: vote, error: null }, 201);
});

const idParamSchema = z.object({ id: z.string().uuid() });

app.patch(
  "/:id",
  paramValidator(idParamSchema),
  jsonValidator(updateVoteSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const { availability } = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(scheduleVotes)
      .where(eq(scheduleVotes.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json(
        { data: null, error: { message: "Vote not found" } },
        404,
      );
    }

    if (existing[0].userId !== userId) {
      return c.json(
        { data: null, error: { message: "Not authorized" } },
        403,
      );
    }

    const schedule = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, existing[0].scheduleId))
      .limit(1);

    if (schedule.length === 0 || schedule[0].status !== "voting") {
      return c.json(
        { data: null, error: { message: "Schedule is not open for voting" } },
        400,
      );
    }

    const [updated] = await db
      .update(scheduleVotes)
      .set({ availability, votedAt: new Date() })
      .where(eq(scheduleVotes.id, id))
      .returning();

    return c.json({ data: updated, error: null });
  },
);

export default app;
