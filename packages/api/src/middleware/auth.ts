import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";

export type AuthEnv = {
  Variables: {
    userId: string;
    userEmail: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      return c.json({ data: null, error: { message: "Not authenticated" } }, 401);
    }

    c.set("userId", session.user.id);
    c.set("userEmail", session.user.email);
    await next();
  } catch {
    return c.json({ data: null, error: { message: "Authentication failed" } }, 401);
  }
});
