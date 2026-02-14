export const MEMBER_ROLES = ["admin", "member"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const MEMBER_STATUSES = ["pending", "active", "inactive"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const SCHEDULE_STATUSES = [
  "draft",
  "voting",
  "closed",
  "confirmed",
] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

export const AVAILABILITIES = ["available", "unavailable", "maybe"] as const;
export type Availability = (typeof AVAILABILITIES)[number];

export const ASSIGNMENT_STATUSES = ["auto", "manual", "confirmed"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "schedule_open",
  "vote_reminder",
  "schedule_confirmed",
  "setlist_posted",
  "join_request",
  "schedule_changed",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const DEFAULT_POSITIONS = [
  { name: "인도자", icon: "mic", color: "#EF4444", minRequired: 1, maxRequired: 1 },
  { name: "싱어", icon: "music", color: "#F59E0B", minRequired: 2, maxRequired: 4 },
  { name: "일렉기타", icon: "guitar-electric", color: "#10B981", minRequired: 1, maxRequired: 1 },
  { name: "어쿠스틱기타", icon: "guitar-acoustic", color: "#06B6D4", minRequired: 0, maxRequired: 1 },
  { name: "베이스", icon: "bass", color: "#8B5CF6", minRequired: 1, maxRequired: 1 },
  { name: "드럼", icon: "drum", color: "#EC4899", minRequired: 1, maxRequired: 1 },
  { name: "건반", icon: "piano", color: "#6366F1", minRequired: 1, maxRequired: 1 },
  { name: "음향", icon: "speaker", color: "#64748B", minRequired: 1, maxRequired: 1 },
] as const;

export const INVITE_CODE_LENGTH = 8;
export const MAX_TEAM_NAME_LENGTH = 50;
export const MAX_CONSECUTIVE_WEEKS = 3;
