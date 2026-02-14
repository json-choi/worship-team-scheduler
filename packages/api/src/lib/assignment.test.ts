import { describe, it, expect } from "bun:test";
import { autoAssign, type AutoAssignInput } from "./assignment";

function deterministicRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const POSITIONS = {
  leader: { id: "pos-leader", name: "인도자", minRequired: 1, maxRequired: 1 },
  singer: { id: "pos-singer", name: "싱어", minRequired: 2, maxRequired: 4 },
  drum: { id: "pos-drum", name: "드럼", minRequired: 1, maxRequired: 1 },
  bass: { id: "pos-bass", name: "베이스", minRequired: 1, maxRequired: 1 },
  guitar: { id: "pos-guitar", name: "일렉기타", minRequired: 1, maxRequired: 1 },
  keyboard: { id: "pos-keyboard", name: "건반", minRequired: 1, maxRequired: 1 },
};

describe("autoAssign", () => {
  it("assigns members to positions based on availability", () => {
    const input: AutoAssignInput = {
      positions: [POSITIONS.drum, POSITIONS.bass],
      votes: [
        { userId: "u1", availability: "available", positions: ["pos-drum"] },
        { userId: "u2", availability: "available", positions: ["pos-bass"] },
        { userId: "u3", availability: "unavailable", positions: ["pos-drum"] },
      ],
      history: [],
      maxConsecutiveWeeks: 3,
    };

    const result = autoAssign(input, deterministicRandom(42));

    expect(result.assignments).toHaveLength(2);
    expect(result.assignments).toContainEqual({
      positionId: "pos-drum",
      userId: "u1",
    });
    expect(result.assignments).toContainEqual({
      positionId: "pos-bass",
      userId: "u2",
    });
    expect(result.warnings).toHaveLength(0);
  });

  it("prefers members with lower participation count", () => {
    const input: AutoAssignInput = {
      positions: [POSITIONS.drum],
      votes: [
        { userId: "u1", availability: "available", positions: ["pos-drum"] },
        { userId: "u2", availability: "available", positions: ["pos-drum"] },
      ],
      history: [
        { userId: "u1", totalCount: 5, lastConsecutiveCount: 0 },
        { userId: "u2", totalCount: 1, lastConsecutiveCount: 0 },
      ],
      maxConsecutiveWeeks: 3,
    };

    const result = autoAssign(input, deterministicRandom(42));

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].userId).toBe("u2");
  });

  it("penalizes members exceeding consecutive week limit", () => {
    const input: AutoAssignInput = {
      positions: [POSITIONS.drum],
      votes: [
        { userId: "u1", availability: "available", positions: ["pos-drum"] },
        { userId: "u2", availability: "available", positions: ["pos-drum"] },
      ],
      history: [
        { userId: "u1", totalCount: 1, lastConsecutiveCount: 3 },
        { userId: "u2", totalCount: 2, lastConsecutiveCount: 0 },
      ],
      maxConsecutiveWeeks: 3,
    };

    const result = autoAssign(input, deterministicRandom(42));

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].userId).toBe("u2");
  });

  it("warns when minimum required not met", () => {
    const input: AutoAssignInput = {
      positions: [POSITIONS.singer],
      votes: [
        { userId: "u1", availability: "available", positions: ["pos-singer"] },
      ],
      history: [],
      maxConsecutiveWeeks: 3,
    };

    const result = autoAssign(input, deterministicRandom(42));

    expect(result.assignments).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("1/2명 배정");
  });

  it("does not assign same member to multiple positions", () => {
    const input: AutoAssignInput = {
      positions: [POSITIONS.drum, POSITIONS.bass],
      votes: [
        {
          userId: "u1",
          availability: "available",
          positions: ["pos-drum", "pos-bass"],
        },
        { userId: "u2", availability: "available", positions: ["pos-bass"] },
      ],
      history: [],
      maxConsecutiveWeeks: 3,
    };

    const result = autoAssign(input, deterministicRandom(42));

    const assignedUsers = result.assignments.map((a) => a.userId);
    const uniqueUsers = new Set(assignedUsers);
    expect(uniqueUsers.size).toBe(assignedUsers.length);
  });

  it("ignores unavailable members", () => {
    const input: AutoAssignInput = {
      positions: [POSITIONS.drum],
      votes: [
        { userId: "u1", availability: "unavailable", positions: ["pos-drum"] },
        { userId: "u2", availability: "maybe", positions: ["pos-drum"] },
        { userId: "u3", availability: "available", positions: ["pos-drum"] },
      ],
      history: [],
      maxConsecutiveWeeks: 3,
    };

    const result = autoAssign(input, deterministicRandom(42));

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].userId).toBe("u3");
  });

  it("handles no available candidates gracefully", () => {
    const input: AutoAssignInput = {
      positions: [POSITIONS.drum],
      votes: [
        { userId: "u1", availability: "unavailable", positions: ["pos-drum"] },
      ],
      history: [],
      maxConsecutiveWeeks: 3,
    };

    const result = autoAssign(input, deterministicRandom(42));

    expect(result.assignments).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("0/1명 배정");
  });

  it("processes critical positions (higher minRequired) first", () => {
    const input: AutoAssignInput = {
      positions: [
        { id: "pos-a", name: "A", minRequired: 1, maxRequired: 1 },
        { id: "pos-b", name: "B", minRequired: 2, maxRequired: 2 },
      ],
      votes: [
        {
          userId: "u1",
          availability: "available",
          positions: ["pos-a", "pos-b"],
        },
        {
          userId: "u2",
          availability: "available",
          positions: ["pos-a", "pos-b"],
        },
        { userId: "u3", availability: "available", positions: ["pos-a"] },
      ],
      history: [],
      maxConsecutiveWeeks: 3,
    };

    const result = autoAssign(input, deterministicRandom(42));

    const posB = result.assignments.filter((a) => a.positionId === "pos-b");
    expect(posB).toHaveLength(2);
  });

  it("fills up to maxRequired when enough candidates exist", () => {
    const input: AutoAssignInput = {
      positions: [POSITIONS.singer],
      votes: [
        { userId: "u1", availability: "available", positions: ["pos-singer"] },
        { userId: "u2", availability: "available", positions: ["pos-singer"] },
        { userId: "u3", availability: "available", positions: ["pos-singer"] },
        { userId: "u4", availability: "available", positions: ["pos-singer"] },
        { userId: "u5", availability: "available", positions: ["pos-singer"] },
      ],
      history: [],
      maxConsecutiveWeeks: 3,
    };

    const result = autoAssign(input, deterministicRandom(42));

    expect(result.assignments.length).toBeGreaterThanOrEqual(2);
    expect(result.assignments.length).toBeLessThanOrEqual(4);
    expect(result.warnings).toHaveLength(0);
  });
});
