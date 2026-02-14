import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "@wts/db";
import { getDb } from "../lib/supabase";
import { jsonValidator } from "../middleware/validate";
import { authMiddleware, type AuthEnv } from "../middleware/auth";

const app = new Hono<AuthEnv>();

const googleCallbackSchema = z.object({
  idToken: z.string(),
  accessToken: z.string().optional(),
});

app.post("/callback/google", jsonValidator(googleCallbackSchema), async (c) => {
  const { idToken } = c.req.valid("json");

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;

    const response = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=id_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          provider: "google",
          id_token: idToken,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      return c.json(
        { data: null, error: { message: `Auth failed: ${error}` } },
        401,
      );
    }

    const session = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      user: { id: string; email: string; user_metadata: { full_name?: string; avatar_url?: string } };
    };

    const db = getDb();
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata.full_name ?? null,
        avatarUrl: session.user.user_metadata.avatar_url ?? null,
      });
    }

    return c.json({
      data: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata.full_name ?? null,
          avatarUrl: session.user.user_metadata.avatar_url ?? null,
          isNewUser: existingUser.length === 0,
        },
      },
      error: null,
    });
  } catch {
    return c.json(
      { data: null, error: { message: "Internal server error" } },
      500,
    );
  }
});

app.get("/me", authMiddleware, async (c) => {
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

app.patch("/me", authMiddleware, jsonValidator(updateProfileSchema), async (c) => {
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
