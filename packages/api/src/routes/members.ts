import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { teamMembers, users } from "@wts/db";
import { updateMemberSchema, approveMemberSchema } from "@wts/shared";
import { getDb } from "../lib/supabase";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { jsonValidator, paramValidator } from "../middleware/validate";

const app = new Hono<AuthEnv>();

app.use(authMiddleware);

const teamIdSchema = z.object({ teamId: z.string().uuid() });

app.get("/team/:teamId", paramValidator(teamIdSchema), async (c) => {
  const { teamId } = c.req.valid("param");
  const db = getDb();

  const members = await db
    .select({
      member: teamMembers,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));

  return c.json({ data: members, error: null });
});

app.get("/team/:teamId/pending", paramValidator(teamIdSchema), async (c) => {
  const { teamId } = c.req.valid("param");
  const db = getDb();

  const pending = await db
    .select({
      member: teamMembers,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.status, "pending"),
      ),
    );

  return c.json({ data: pending, error: null });
});

app.post("/approve", jsonValidator(approveMemberSchema), async (c) => {
  const userId = c.get("userId");
  const { memberId, approved } = c.req.valid("json");
  const db = getDb();

  const targetMember = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.id, memberId))
    .limit(1);

  if (targetMember.length === 0) {
    return c.json({ data: null, error: { message: "Member not found" } }, 404);
  }

  const adminCheck = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, targetMember[0].teamId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, "admin"),
      ),
    )
    .limit(1);

  if (adminCheck.length === 0) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  if (approved) {
    const [updated] = await db
      .update(teamMembers)
      .set({ status: "active" })
      .where(eq(teamMembers.id, memberId))
      .returning();
    return c.json({ data: updated, error: null });
  } else {
    await db.delete(teamMembers).where(eq(teamMembers.id, memberId));
    return c.json({ data: { success: true }, error: null });
  }
});

const memberIdSchema = z.object({ id: z.string().uuid() });

app.patch("/:id", paramValidator(memberIdSchema), jsonValidator(updateMemberSchema), async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = getDb();

  const targetMember = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.id, id))
    .limit(1);

  if (targetMember.length === 0) {
    return c.json({ data: null, error: { message: "Member not found" } }, 404);
  }

  const adminCheck = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, targetMember[0].teamId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, "admin"),
      ),
    )
    .limit(1);

  if (adminCheck.length === 0) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  const [updated] = await db
    .update(teamMembers)
    .set(body)
    .where(eq(teamMembers.id, id))
    .returning();

  return c.json({ data: updated, error: null });
});

app.delete("/:id", paramValidator(memberIdSchema), async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const db = getDb();

  const targetMember = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.id, id))
    .limit(1);

  if (targetMember.length === 0) {
    return c.json({ data: null, error: { message: "Member not found" } }, 404);
  }

  const adminCheck = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, targetMember[0].teamId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, "admin"),
      ),
    )
    .limit(1);

  if (adminCheck.length === 0) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  await db.delete(teamMembers).where(eq(teamMembers.id, id));

  return c.json({ data: { success: true }, error: null });
});

export default app;
