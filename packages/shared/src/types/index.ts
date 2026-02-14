export interface Team {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  schedulePattern: SchedulePattern | null;
  settings: TeamSettings;
  createdAt: string;
}

export interface SchedulePattern {
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
}

export interface TeamSettings {
  maxConsecutiveWeeks?: number;
  votingDeadlineDays?: number;
  allowMultiplePositions?: boolean;
}

export interface TeamPosition {
  id: string;
  teamId: string;
  name: string;
  sortOrder: number;
  minRequired: number;
  maxRequired: number;
  icon: string | null;
  color: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "admin" | "member";
  positions: string[];
  status: "pending" | "active" | "inactive";
  joinedAt: string;
  user?: User;
}

export interface Schedule {
  id: string;
  teamId: string;
  date: string;
  timeStart: string | null;
  timeEnd: string | null;
  title: string;
  description: string | null;
  status: "draft" | "voting" | "closed" | "confirmed";
  votingDeadline: string | null;
  createdBy: string;
  createdAt: string;
}

export interface ScheduleVote {
  id: string;
  scheduleId: string;
  userId: string;
  availability: "available" | "unavailable" | "maybe";
  votedAt: string;
}

export interface ScheduleAssignment {
  id: string;
  scheduleId: string;
  userId: string;
  positionId: string;
  status: "auto" | "manual" | "confirmed";
  assignedAt: string;
}

export interface Setlist {
  id: string;
  scheduleId: string;
  createdBy: string;
  content: string | null;
  songs: Song[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Song {
  name: string;
  key: string;
  bpm?: number;
  youtubeUrl?: string;
  order: number;
}

export interface SetlistComment {
  id: string;
  setlistId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
  };
}
