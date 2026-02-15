import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { teams, teamMembers, teamPositions, users } from "@wts/db";
import { createTeamSchema, updateTeamSchema, joinTeamSchema } from "@wts/shared";
import { DEFAULT_POSITIONS, INVITE_CODE_LENGTH } from "@wts/shared";
import { getDb } from "../lib/db";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { jsonValidator, paramValidator } from "../middleware/validate";

const app = new Hono<AuthEnv>();

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

app.use(authMiddleware);

app.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const memberships = await db
    .select({
      team: teams,
      membership: teamMembers,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId));

  return c.json({ data: memberships, error: null });
});

app.post("/", jsonValidator(createTeamSchema), async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = getDb();

  const inviteCode = generateInviteCode();

  const [team] = await db
    .insert(teams)
    .values({
      name: body.name,
      description: body.description,
      inviteCode,
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    role: "admin",
    status: "active",
  });

  const positionValues = DEFAULT_POSITIONS.map((pos, idx) => ({
    teamId: team.id,
    name: pos.name,
    sortOrder: idx,
    minRequired: pos.minRequired,
    maxRequired: pos.maxRequired,
    icon: pos.icon,
    color: pos.color,
  }));

  await db.insert(teamPositions).values(positionValues);

  return c.json({ data: team, error: null }, 201);
});

const idParamSchema = z.object({ id: z.string().uuid() });

app.get("/:id", paramValidator(idParamSchema), async (c) => {
  const { id } = c.req.valid("param");
  const db = getDb();

  const team = await db.select().from(teams).where(eq(teams.id, id)).limit(1);

  if (team.length === 0) {
    return c.json({ data: null, error: { message: "Team not found" } }, 404);
  }

  return c.json({ data: team[0], error: null });
});

app.patch("/:id", paramValidator(idParamSchema), jsonValidator(updateTeamSchema), async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = getDb();

  const member = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, id),
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, "admin"),
      ),
    )
    .limit(1);

  if (member.length === 0) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  const updated = await db
    .update(teams)
    .set(body)
    .where(eq(teams.id, id))
    .returning();

  return c.json({ data: updated[0], error: null });
});

app.post("/join", jsonValidator(joinTeamSchema), async (c) => {
  const userId = c.get("userId");
  const { inviteCode, positions } = c.req.valid("json");
  const db = getDb();

  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.inviteCode, inviteCode))
    .limit(1);

  if (team.length === 0) {
    return c.json(
      { data: null, error: { message: "Invalid invite code" } },
      404,
    );
  }

  const existingMember = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, team[0].id),
        eq(teamMembers.userId, userId),
      ),
    )
    .limit(1);

  if (existingMember.length > 0) {
    return c.json(
      { data: null, error: { message: "Already a member or pending" } },
      409,
    );
  }

  const [membership] = await db
    .insert(teamMembers)
    .values({
      teamId: team[0].id,
      userId,
      role: "member",
      status: "pending",
      positions: positions ?? [],
    })
    .returning();

  return c.json({ data: { team: team[0], membership }, error: null }, 201);
});

app.post("/:id/regenerate-code", paramValidator(idParamSchema), async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const db = getDb();

  const member = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, id),
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, "admin"),
      ),
    )
    .limit(1);

  if (member.length === 0) {
    return c.json({ data: null, error: { message: "Not authorized" } }, 403);
  }

  const newCode = generateInviteCode();
  const [updated] = await db
    .update(teams)
    .set({ inviteCode: newCode })
    .where(eq(teams.id, id))
    .returning();

  return c.json({ data: updated, error: null });
});

export default app;
