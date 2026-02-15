import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from "./routes/auth";
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
  }),
);

app.route("/auth", auth);
app.route("/teams", teams);
app.route("/positions", positions);
app.route("/members", members);
app.route("/schedules", schedulesRoute);
app.route("/votes", votesRoute);
app.route("/assignments", assignmentsRoute);

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};

console.log(`🚀 API server running on http://localhost:${port}`);
