import { describe, it, expect } from "vitest";
import { sessionSchema, registerSchema } from "../src/schemas.js";
import { computeStats } from "../src/stats.js";
import { matchesMime } from "../src/storage.js";
import type { StudySession } from "@prisma/client";
const base = {
  goal_text: "Ôn tập",
  topic_id: "biology",
  target_duration_seconds: 60,
  actual_duration_seconds: 0,
  distraction_attempts: 0,
  quiz_score: 0,
  total_quiz_questions: 0,
  is_completed: false,
  apps_blocked: [],
  documents: [],
};
describe("session validation", () => {
  it("accepts a given-up session without quiz", () =>
    expect(sessionSchema.parse(base).total_quiz_questions).toBe(0));
  it.each([
    { quiz_score: 1 },
    { actual_duration_seconds: 61 },
    { target_duration_seconds: 59 },
    { is_completed: true },
    { topic_id: "../../other" },
  ])("rejects inconsistent values %j", (patch) =>
    expect(sessionSchema.safeParse({ ...base, ...patch }).success).toBe(false),
  );
  it("validates Vietnamese names and strong passwords", () => {
    expect(
      registerSchema.safeParse({
        email: "user@example.com",
        name: "Nguyễn Văn A",
        password: "Secure@123",
      }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({
        email: "user@example.com",
        name: "Nguyễn",
        password: "weak",
      }).success,
    ).toBe(false);
  });
});
it("returns finite empty metrics", () => {
  const s = computeStats([]);
  expect(s.total_sessions).toBe(0);
  expect(s.average_quiz_score).toBe(0);
  expect(s.completion_rate).toBe(0);
});
it("weights quiz accuracy and counts streaks across month boundary", () => {
  const rows = [
    {
      ...base,
      created_at: new Date("2026-09-30T10:00:00Z"),
      actual_duration_seconds: 60,
      is_completed: true,
      quiz_score: 1,
      total_quiz_questions: 1,
      apps_blocked: ["app", "app"],
    },
    {
      ...base,
      created_at: new Date("2026-10-01T10:00:00Z"),
      actual_duration_seconds: 60,
      is_completed: true,
      quiz_score: 1,
      total_quiz_questions: 3,
      apps_blocked: ["app"],
    },
  ];
  const s = computeStats(
    rows as unknown as StudySession[],
    new Date("2026-10-02T10:00:00Z"),
  );
  expect(s.average_quiz_score).toBe(0.5);
  expect(s.streak_days).toBe(2);
  expect(s.most_blocked_apps[0].count).toBe(2);
});
it("rejects spoofed document MIME and permits text", () => {
  expect(matchesMime(Buffer.from("not a pdf"), "application/pdf")).toBe(false);
  expect(matchesMime(Buffer.from("study"), "text/plain")).toBe(true);
});

import { Metrics } from "../src/metrics.js";
it("records bounded request labels and cumulative latency buckets", () => {
  const metrics = new Metrics();
  metrics.record("GET", "/sessions/:id", 200, 0.05);
  metrics.record("GET", "/sessions/:id", 503, 0.5);
  metrics.recordQuiz(1.2);
  const output = metrics.render(3);
  expect(output).toContain("error_rate 0.5");
  expect(output).toContain("active_sessions 3");
  expect(output).toContain('http_request_duration_seconds_bucket{le="0.5"} 2');
  expect(output).toContain("quiz_generation_duration_seconds_count 1");
});
