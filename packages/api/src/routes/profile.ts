import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "@wts/db";
import { getDb } from "../lib/db";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { jsonValidator } from "../middleware/validate";

const app = new Hono<AuthEnv>();

app.use(authMiddleware);

// GET /api/profile/me — get current user profile
app.get("/me", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    return c.json({ data: null, error: { message: "User not found" } }, 404);
  }

  return c.json({ data: user[0], error: null });
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
});

// PATCH /api/profile/me — update current user profile
app.patch("/me", jsonValidator(updateProfileSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = getDb();

  const updated = await db
    .update(users)
    .set(body)
    .where(eq(users.id, userId))
    .returning();

  return c.json({ data: updated[0], error: null });
});

export default app;
