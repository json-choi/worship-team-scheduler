import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import profile from "./routes/profile";
import teams from "./routes/teams";
import positions from "./routes/positions";
import members from "./routes/members";
import schedulesRoute from "./routes/schedules";
import votesRoute from "./routes/votes";
import assignmentsRoute from "./routes/assignments";

const app = new Hono().basePath("/api");

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Better Auth handler — handles all /api/auth/* routes
app.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// App routes
app.route("/profile", profile);
app.route("/teams", teams);
app.route("/positions", positions);
app.route("/members", members);
app.route("/schedules", schedulesRoute);
app.route("/votes", votesRoute);
app.route("/assignments", assignmentsRoute);

app.get("/health", (c) => c.json({ status: "ok" }));

export type AppType = typeof app;

export default handle(app);
