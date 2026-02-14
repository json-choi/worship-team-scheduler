export interface PositionConfig {
  id: string;
  name: string;
  minRequired: number;
  maxRequired: number;
}

export interface MemberVote {
  userId: string;
  availability: "available" | "unavailable" | "maybe";
  positions: string[];
}

export interface ParticipationRecord {
  userId: string;
  totalCount: number;
  lastConsecutiveCount: number;
}

export interface AssignmentResult {
  assignments: Array<{
    positionId: string;
    userId: string;
  }>;
  warnings: string[];
}

export interface AutoAssignInput {
  positions: PositionConfig[];
  votes: MemberVote[];
  history: ParticipationRecord[];
  maxConsecutiveWeeks: number;
}

/**
 * Fairness-based auto-assignment. Scoring per candidate:
 *   score = totalCount + (consecutive >= max ? 1000 : 0) - lastConsecutiveCount * 0.01
 * Lower score = higher priority. Ties broken by randomFn.
 * Positions processed in descending minRequired order (critical-first).
 */
export function autoAssign(
  input: AutoAssignInput,
  randomFn: () => number = Math.random,
): AssignmentResult {
  const { positions, votes, history, maxConsecutiveWeeks } = input;

  const assignments: Array<{ positionId: string; userId: string }> = [];
  const warnings: string[] = [];
  const assignedUserIds = new Set<string>();

  const historyMap = new Map<
    string,
    { totalCount: number; lastConsecutiveCount: number }
  >();
  for (const record of history) {
    historyMap.set(record.userId, {
      totalCount: record.totalCount,
      lastConsecutiveCount: record.lastConsecutiveCount,
    });
  }

  const sortedPositions = [...positions].sort(
    (a, b) => b.minRequired - a.minRequired,
  );

  for (const position of sortedPositions) {
    const candidates = votes.filter(
      (v) =>
        v.availability === "available" &&
        v.positions.includes(position.id) &&
        !assignedUserIds.has(v.userId),
    );

    const scored = candidates.map((candidate) => {
      const h = historyMap.get(candidate.userId) ?? {
        totalCount: 0,
        lastConsecutiveCount: 0,
      };

      const consecutivePenalty =
        h.lastConsecutiveCount >= maxConsecutiveWeeks ? 1000 : 0;

      return {
        userId: candidate.userId,
        score:
          h.totalCount + consecutivePenalty - h.lastConsecutiveCount * 0.01,
        random: randomFn(),
      };
    });

    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.random - b.random;
    });

    const needed = position.minRequired;
    const maxSlots = position.maxRequired;
    const toAssign = scored.slice(
      0,
      Math.max(needed, Math.min(maxSlots, scored.length)),
    );

    for (const s of toAssign) {
      assignments.push({ positionId: position.id, userId: s.userId });
      assignedUserIds.add(s.userId);
    }

    if (toAssign.length < needed) {
      warnings.push(
        `${position.name}: ${toAssign.length}/${needed}명 배정 (최소 인원 미달)`,
      );
    }
  }

  return { assignments, warnings };
}
