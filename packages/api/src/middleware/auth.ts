import { createMiddleware } from "hono/factory";

export type AuthEnv = {
  Variables: {
    userId: string;
    userEmail: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ data: null, error: { message: "Missing authorization header" } }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY! },
    });

    if (!response.ok) {
      return c.json({ data: null, error: { message: "Invalid token" } }, 401);
    }

    const user = (await response.json()) as { id: string; email: string };
    c.set("userId", user.id);
    c.set("userEmail", user.email);
    await next();
  } catch {
    return c.json({ data: null, error: { message: "Authentication failed" } }, 401);
  }
});
