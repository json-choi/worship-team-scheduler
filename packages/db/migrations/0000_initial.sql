DO $$ BEGIN
  CREATE TYPE "member_role" AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "member_status" AS ENUM ('pending', 'active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "schedule_status" AS ENUM ('draft', 'voting', 'closed', 'confirmed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "availability" AS ENUM ('available', 'unavailable', 'maybe');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "assignment_status" AS ENUM ('auto', 'manual', 'confirmed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "notification_type" AS ENUM ('schedule_open', 'vote_reminder', 'schedule_confirmed', 'setlist_posted', 'join_request', 'schedule_changed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "invite_code" text NOT NULL UNIQUE,
  "schedule_pattern" jsonb,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "team_positions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "min_required" integer NOT NULL DEFAULT 1,
  "max_required" integer NOT NULL DEFAULT 1,
  "icon" text,
  "color" text
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "phone" text,
  "avatar_url" text,
  "google_calendar_token" text,
  "push_token" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "member_role" NOT NULL DEFAULT 'member',
  "positions" jsonb DEFAULT '[]'::jsonb,
  "status" "member_status" NOT NULL DEFAULT 'pending',
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_user_idx" ON "team_members" ("team_id", "user_id");

CREATE TABLE IF NOT EXISTS "schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "date" timestamp with time zone NOT NULL,
  "time_start" text,
  "time_end" text,
  "title" text NOT NULL,
  "description" text,
  "status" "schedule_status" NOT NULL DEFAULT 'draft',
  "voting_deadline" timestamp with time zone,
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "schedule_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "schedule_id" uuid NOT NULL REFERENCES "schedules"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "availability" "availability" NOT NULL,
  "voted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "schedule_votes_schedule_user_idx" ON "schedule_votes" ("schedule_id", "user_id");

CREATE TABLE IF NOT EXISTS "schedule_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "schedule_id" uuid NOT NULL REFERENCES "schedules"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "position_id" uuid NOT NULL REFERENCES "team_positions"("id") ON DELETE CASCADE,
  "status" "assignment_status" NOT NULL DEFAULT 'auto',
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "schedule_assignments_schedule_user_idx" ON "schedule_assignments" ("schedule_id", "user_id");

CREATE TABLE IF NOT EXISTS "setlists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "schedule_id" uuid NOT NULL REFERENCES "schedules"("id") ON DELETE CASCADE,
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "content" text,
  "songs" jsonb DEFAULT '[]'::jsonb,
  "attachments" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "setlist_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "setlist_id" uuid NOT NULL REFERENCES "setlists"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "notification_type" NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "data" jsonb,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" ("user_id", "created_at" DESC);
