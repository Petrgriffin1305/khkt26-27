import { createHmac } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { config } from "./config.js";
import {
  breakElapsedSeconds,
  isValidBreakPlan,
  studyElapsedSeconds,
  totalDurationSeconds,
  type Session,
} from "./adventure/domain.js";

export function goalSummary(goal: string): string {
  const text = goal.replace(/[\p{Cc}\p{Cf}]/gu, " ").replace(/\s+/gu, " ").trim();
  const characters = Array.from(text);
  return characters.length > 200 ? characters.slice(0, 199).join("") + "…" : text;
}

export function experimentRecord(session: Session, secret: string) {
  const hash = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
  const id = hash(`trip:${session.userId}:${session.id}`);
  const wallElapsed = Math.max(0, (session.ended - session.started) / 1000);
  const elapsedSeconds = Math.min(totalDurationSeconds(session.target, session.breakPlan), wallElapsed);
  const studyElapsed = studyElapsedSeconds(session.started, session.target, session.breakPlan, session.ended);
  const plannedBreakSeconds = session.breakPlan && isValidBreakPlan(session.breakPlan, session.target)
    ? session.breakPlan.count * session.breakPlan.seconds
    : 0;
  const breakSeconds = session.breakPlan
    ? breakElapsedSeconds(session.started, session.target, session.breakPlan, session.ended)
    : session.segments.reduce(
      (sum, segment) => sum + (segment.kind === "break" ? Math.max(0, (segment.end - segment.start) / 1000) : 0),
      0,
    );
  return {
    id, tripCode: `V-${id.slice(0, 12).toUpperCase()}`,
    testerCode: `T-${hash(`tester:${session.userId}`).slice(0, 10).toUpperCase()}`,
    goalSummary: goalSummary(session.goal), topic: session.topic,
    targetSeconds: session.target, elapsedSeconds, studyElapsedSeconds: studyElapsed,
    breakSeconds, plannedBreakSeconds, focusedSeconds: session.seconds,
    distractions: session.distractions ?? session.segments.filter(segment => segment.kind === "distraction").length,
    deviceCategory: session.deviceCategory ?? null,
    completed: studyElapsed >= session.target,
    quizScore: session.quiz?.score ?? null, quizTotal: session.quiz?.total ?? null,
    startedAt: new Date(session.started).toISOString(), endedAt: new Date(session.ended).toISOString(),
    recordedAt: new Date(session.ended).toISOString(),
  };
}

export function experimentCsv(rows: ReturnType<typeof experimentRecord>[]) {
  const headers = ["trip_code", "tester_code", "goal_summary", "topic", "started_at", "ended_at",
    "target_seconds", "elapsed_seconds", "study_elapsed_seconds", "break_seconds", "planned_break_seconds",
    "focused_seconds", "distractions", "device_category", "timer_completed", "quiz_score", "quiz_total"];
  const cell = (value: unknown) => `"${String(value ?? "").replace(/^\s*[=+@-]/, "'$&").replaceAll('"', '""')}"`;
  return '\uFEFF' + [headers.join(","), ...rows.map(row => [row.tripCode, row.testerCode, row.goalSummary,
    row.topic, row.startedAt, row.endedAt, row.targetSeconds, row.elapsedSeconds, row.studyElapsedSeconds,
    row.breakSeconds, row.plannedBreakSeconds, row.focusedSeconds,
    row.distractions, row.deviceCategory, row.completed, row.quizScore, row.quizTotal].map(cell).join(","))].join("\r\n");
}

export function experimentRoutes(app: FastifyInstance, db: PrismaClient) {
  // Saved sessions are authoritative: this includes older trips and their latest quiz grade.
  const readRows = (limit: number, offset: number) => db.$queryRaw<{ session: Session }[]>`
    SELECT entry.value AS session
    FROM adventure_state a CROSS JOIN LATERAL jsonb_each(a.state->'sessions') entry
    WHERE a.id = 1
    ORDER BY (entry.value->>'ended')::bigint DESC, entry.key DESC LIMIT ${limit} OFFSET ${offset}`;
  app.get("/api/v1/experiments", async req => {
    const { limit, offset } = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50),
      offset: z.coerce.number().int().min(0).max(100000).default(0) }).parse(req.query);
    const rows = await readRows(limit, offset);
    const count = await db.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::int AS total FROM adventure_state a
      CROSS JOIN LATERAL jsonb_each(a.state->'sessions') entry WHERE a.id = 1`;
    return { runs: rows.map(row => experimentRecord(row.session, config.JWT_SECRET)), total: count[0].total, limit, offset };
  });
  app.get("/api/v1/experiments/export.csv", async (_req, reply) => {
    const rows = await readRows(10000, 0);
    return reply.header("Content-Disposition", 'attachment; filename="viendu-trip-history.csv"')
      .type("text/csv; charset=utf-8").send(experimentCsv(rows.map(row => experimentRecord(row.session, config.JWT_SECRET))));
  });
}
