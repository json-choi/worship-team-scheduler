import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const memberRoleEnum = pgEnum("member_role", ["admin", "member"]);
export const memberStatusEnum = pgEnum("member_status", [
  "pending",
  "active",
  "inactive",
]);
export const scheduleStatusEnum = pgEnum("schedule_status", [
  "draft",
  "voting",
  "closed",
  "confirmed",
]);
export const availabilityEnum = pgEnum("availability", [
  "available",
  "unavailable",
  "maybe",
]);
export const assignmentStatusEnum = pgEnum("assignment_status", [
  "auto",
  "manual",
  "confirmed",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "schedule_open",
  "vote_reminder",
  "schedule_confirmed",
  "setlist_posted",
  "join_request",
  "schedule_changed",
]);

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  inviteCode: text("invite_code").notNull().unique(),
  schedulePattern: jsonb("schedule_pattern"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  positions: many(teamPositions),
  members: many(teamMembers),
  schedules: many(schedules),
}));

export const teamPositions = pgTable("team_positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  minRequired: integer("min_required").notNull().default(1),
  maxRequired: integer("max_required").notNull().default(1),
  icon: text("icon"),
  color: text("color"),
});

export const teamPositionsRelations = relations(
  teamPositions,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [teamPositions.teamId],
      references: [teams.id],
    }),
    assignments: many(scheduleAssignments),
  }),
);

// Better Auth core table: user (mapped to "users")
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("avatar_url"),
  phone: text("phone"),
  googleCalendarToken: text("google_calendar_token"),
  pushToken: text("push_token"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(teamMembers),
  votes: many(scheduleVotes),
  assignments: many(scheduleAssignments),
  notifications: many(notifications),
  sessions: many(sessions),
  accounts: many(accounts),
}));

// Better Auth core table: session
export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// Better Auth core table: account
export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

// Better Auth core table: verification
export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    positions: jsonb("positions").default([]),
    status: memberStatusEnum("status").notNull().default("pending"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("team_members_team_user_idx").on(table.teamId, table.userId),
  ],
);

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

export const schedules = pgTable("schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  timeStart: text("time_start"),
  timeEnd: text("time_end"),
  title: text("title").notNull(),
  description: text("description"),
  status: scheduleStatusEnum("status").notNull().default("draft"),
  votingDeadline: timestamp("voting_deadline", { withTimezone: true }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  team: one(teams, { fields: [schedules.teamId], references: [teams.id] }),
  creator: one(users, { fields: [schedules.createdBy], references: [users.id] }),
  votes: many(scheduleVotes),
  assignments: many(scheduleAssignments),
  setlists: many(setlists),
}));

export const scheduleVotes = pgTable(
  "schedule_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => schedules.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    availability: availabilityEnum("availability").notNull(),
    votedAt: timestamp("voted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("schedule_votes_schedule_user_idx").on(
      table.scheduleId,
      table.userId,
    ),
  ],
);

export const scheduleVotesRelations = relations(scheduleVotes, ({ one }) => ({
  schedule: one(schedules, {
    fields: [scheduleVotes.scheduleId],
    references: [schedules.id],
  }),
  user: one(users, { fields: [scheduleVotes.userId], references: [users.id] }),
}));

export const scheduleAssignments = pgTable(
  "schedule_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => schedules.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    positionId: uuid("position_id")
      .notNull()
      .references(() => teamPositions.id, { onDelete: "cascade" }),
    status: assignmentStatusEnum("status").notNull().default("auto"),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("schedule_assignments_schedule_user_idx").on(
      table.scheduleId,
      table.userId,
    ),
  ],
);

export const scheduleAssignmentsRelations = relations(
  scheduleAssignments,
  ({ one }) => ({
    schedule: one(schedules, {
      fields: [scheduleAssignments.scheduleId],
      references: [schedules.id],
    }),
    user: one(users, {
      fields: [scheduleAssignments.userId],
      references: [users.id],
    }),
    position: one(teamPositions, {
      fields: [scheduleAssignments.positionId],
      references: [teamPositions.id],
    }),
  }),
);

export const setlists = pgTable("setlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  scheduleId: uuid("schedule_id")
    .notNull()
    .references(() => schedules.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  content: text("content"),
  songs: jsonb("songs").default([]),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const setlistsRelations = relations(setlists, ({ one, many }) => ({
  schedule: one(schedules, {
    fields: [setlists.scheduleId],
    references: [schedules.id],
  }),
  creator: one(users, { fields: [setlists.createdBy], references: [users.id] }),
  comments: many(setlistComments),
}));

export const setlistComments = pgTable("setlist_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  setlistId: uuid("setlist_id")
    .notNull()
    .references(() => setlists.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const setlistCommentsRelations = relations(
  setlistComments,
  ({ one }) => ({
    setlist: one(setlists, {
      fields: [setlistComments.setlistId],
      references: [setlists.id],
    }),
    user: one(users, {
      fields: [setlistComments.userId],
      references: [users.id],
    }),
  }),
);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  data: jsonb("data"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
