import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { teamPositions, teamMembers } from "@wts/db";
import {
  createPositionSchema,
  updatePositionSchema,
  reorderPositionsSchema,
} from "@wts/shared";
import { getDb } from "../lib/supabase";
import { type AuthEnv } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";
import { jsonValidator, paramValidator } from "../middleware/validate";

const app = new Hono<AuthEnv>();

app.use(authMiddleware);

const teamIdSchema = z.object({ teamId: z.string().uuid() });

async function requireAdmin(teamId: string, userId: string) {
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

app.get("/team/:teamId", paramValidator(teamIdSchema), async (c) => {
  const { teamId } = c.req.valid("param");
  const db = getDb();

  const positions = await db
    .select()
    .from(teamPositions)
    .where(eq(teamPositions.teamId, teamId))
    .orderBy(teamPositions.sortOrder);

  return c.json({ data: positions, error: null });
});

app.post("/", jsonValidator(createPositionSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = getDb();

  if (!(await requireAdmin(body.teamId, userId))) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  const [position] = await db.insert(teamPositions).values(body).returning();

  return c.json({ data: position, error: null }, 201);
});

const idParamSchema = z.object({ id: z.string().uuid() });

app.patch("/:id", paramValidator(idParamSchema), jsonValidator(updatePositionSchema), async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = getDb();

  const existing = await db
    .select()
    .from(teamPositions)
    .where(eq(teamPositions.id, id))
    .limit(1);

  if (existing.length === 0) {
    return c.json({ data: null, error: { message: "Position not found" } }, 404);
  }

  if (!(await requireAdmin(existing[0].teamId, userId))) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  const [updated] = await db
    .update(teamPositions)
    .set(body)
    .where(eq(teamPositions.id, id))
    .returning();

  return c.json({ data: updated, error: null });
});

app.delete("/:id", paramValidator(idParamSchema), async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const db = getDb();

  const existing = await db
    .select()
    .from(teamPositions)
    .where(eq(teamPositions.id, id))
    .limit(1);

  if (existing.length === 0) {
    return c.json({ data: null, error: { message: "Position not found" } }, 404);
  }

  if (!(await requireAdmin(existing[0].teamId, userId))) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  await db.delete(teamPositions).where(eq(teamPositions.id, id));

  return c.json({ data: { success: true }, error: null });
});

app.put("/reorder", jsonValidator(reorderPositionsSchema), async (c) => {
  const userId = c.get("userId");
  const { positions } = c.req.valid("json");
  const db = getDb();

  if (positions.length === 0) {
    return c.json({ data: null, error: { message: "No positions to reorder" } }, 400);
  }

  const first = await db
    .select()
    .from(teamPositions)
    .where(eq(teamPositions.id, positions[0].id))
    .limit(1);

  if (first.length === 0) {
    return c.json({ data: null, error: { message: "Position not found" } }, 404);
  }

  if (!(await requireAdmin(first[0].teamId, userId))) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  for (const pos of positions) {
    await db
      .update(teamPositions)
      .set({ sortOrder: pos.sortOrder })
      .where(eq(teamPositions.id, pos.id));
  }

  return c.json({ data: { success: true }, error: null });
});

export default app;
