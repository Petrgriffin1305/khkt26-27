import { describe, expect, it } from "vitest";
import { experimentRecord, experimentCsv, goalSummary } from "../src/experiments.js";
import type { Session } from "../src/adventure/domain.js";

const session: Session = {
  id: "e9527db1-0c86-424c-976f-b213cb86bd90", userId: "private-owner", groupId: null,
  goal: "Private personal learning goal", topic: "biology", started: 1000, ended: 61000,
  target: 60, segments: [{ start: 1000, end: 11000, kind: "focus" },
    { start: 11000, end: 31000, kind: "distraction" },
    { start: 31000, end: 61000, kind: "focus" }],
  seconds: 40, contribution: 40, rules: "train-v1", quiz: { score: 2, total: 3 },
};

describe("public trip history projections", () => {
  it("derives stable tester and unique per-trip pseudonyms without exposing source IDs", () => {
    const record = experimentRecord(session, "server-secret");
    const otherTrip = experimentRecord({ ...session, id: "c0d3e52c-08e6-4f36-a33e-004c26c90b47" }, "server-secret");

    expect(record).toMatchObject({
      topic: "biology", targetSeconds: 60, elapsedSeconds: 60, focusedSeconds: 40,
      distractions: 1, completed: true, quizScore: 2, quizTotal: 3,
      goalSummary: "Private personal learning goal",
      startedAt: "1970-01-01T00:00:01.000Z", endedAt: "1970-01-01T00:01:01.000Z",
      recordedAt: "1970-01-01T00:01:01.000Z",
    });
    expect(record.id).toMatch(/^[a-f0-9]{64}$/);
    expect(record.tripCode).toBe(`V-${record.id.slice(0, 12).toUpperCase()}`);
    expect(record.tripCode).toMatch(/^V-[A-F0-9]{12}$/);
    expect(record.testerCode).toMatch(/^T-[A-F0-9]{10}$/);
    expect(otherTrip.id).not.toBe(record.id);
    expect(otherTrip.tripCode).not.toBe(record.tripCode);
    expect(otherTrip.testerCode).toBe(record.testerCode);
    for (const privateValue of [session.id, session.userId, "owner@example.com"])
      expect(JSON.stringify(record)).not.toContain(privateValue);
  });

  it("normalizes controls and whitespace, truncating at 200 Unicode characters", () => {
    expect(goalSummary("  Study\t\n\u0000  artificial\u0007 intelligence  ")).toBe("Study artificial intelligence");
    const summary = goalSummary("學習".repeat(101));
    expect(Array.from(summary)).toHaveLength(200);
    expect(summary.endsWith("…")).toBe(true);
  });

  it("keeps early-ended timer results incomplete and guards CSV formula cells", () => {
    const record = experimentRecord({
      ...session,
      goal: "=HYPERLINK(\"https://example.invalid\",\"open\")",
      ended: 31000,
      quiz: undefined,
    }, "server-secret");
    expect(record).toMatchObject({ elapsedSeconds: 30, completed: false, quizScore: null, quizTotal: null });

    const csv = experimentCsv([record]);
    expect(csv).toContain("trip_code");
    expect(csv).toContain("goal_summary");
    expect(csv).toContain("started_at");
    expect(csv).toContain("ended_at");
    expect(csv).toContain("target_seconds");
    expect(csv).toContain(record.tripCode);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).not.toContain(',"=HYPERLINK');
    expect(csv).not.toContain(session.id);
    expect(csv).not.toContain(session.userId);
  });

  it("records planned rest separately and completes against study wallbudget", () => {
    const completed = experimentRecord({
      ...session,
      started: 1000,
      ended: 661000,
      target: 600,
      breakPlan: { count: 1, seconds: 60 },
      segments: [
        { start: 1000, end: 301000, kind: "focus" },
        { start: 301000, end: 361000, kind: "break" },
        { start: 361000, end: 661000, kind: "focus" },
      ],
      seconds: 600,
    }, "server-secret");
    const early = experimentRecord({
      ...session,
      started: 1000,
      ended: 331000,
      target: 600,
      breakPlan: { count: 1, seconds: 60 },
      segments: [
        { start: 1000, end: 301000, kind: "focus" },
        { start: 301000, end: 331000, kind: "break" },
      ],
      seconds: 300,
    }, "server-secret");

    expect(completed).toMatchObject({
      elapsedSeconds: 660,
      studyElapsedSeconds: 600,
      breakSeconds: 60,
      plannedBreakSeconds: 60,
      completed: true,
    });
    expect(early).toMatchObject({
      elapsedSeconds: 330,
      studyElapsedSeconds: 300,
      breakSeconds: 30,
      plannedBreakSeconds: 60,
      completed: false,
    });
    expect(experimentCsv([completed])).toContain("study_elapsed_seconds");
    expect(experimentCsv([completed])).toContain("planned_break_seconds");
    expect(experimentCsv([completed])).toContain("break_seconds");
  });

  it("publishes only the coarse device category and labels legacy records as missing", () => {
    const current = experimentRecord({ ...session, deviceCategory: "tablet" }, "server-secret");
    const legacy = experimentRecord(session, "server-secret");

    expect(current.deviceCategory).toBe("tablet");
    expect(legacy.deviceCategory).toBeNull();
    expect(JSON.stringify(current)).not.toContain("userAgent");
    expect(experimentCsv([current])).toContain("device_category");
    expect(experimentCsv([current])).toContain('"tablet"');
  });
});
