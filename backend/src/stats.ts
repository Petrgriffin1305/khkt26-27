import type { StudySession } from "@prisma/client";
const formatted = (s: number) =>
  `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
export function computeStats(sessions: StudySession[], now = new Date()) {
  const total = sessions.length;
  const focus = sessions.reduce((n, s) => n + s.actual_duration_seconds, 0);
  const attempts = sessions.reduce((n, s) => n + s.distraction_attempts, 0);
  const correct = sessions.reduce((n, s) => n + s.quiz_score, 0);
  const questions = sessions.reduce((n, s) => n + s.total_quiz_questions, 0);
  const days = new Map<
    string,
    { date: string; focus_time_seconds: number; sessions: number }
  >();
  const apps = new Map<string, number>();
  for (const s of sessions) {
    const date = s.created_at.toISOString().slice(0, 10);
    const day = days.get(date) ?? { date, focus_time_seconds: 0, sessions: 0 };
    day.focus_time_seconds += s.actual_duration_seconds;
    day.sessions++;
    days.set(date, day);
    for (const app of new Set(s.apps_blocked as string[]))
      apps.set(app, (apps.get(app) ?? 0) + 1);
  }
  const active = new Set(
    sessions
      .filter((s) => s.is_completed)
      .map((s) => s.created_at.toISOString().slice(0, 10)),
  );
  const cursor = new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  if (!active.has(cursor.toISOString().slice(0, 10)))
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (active.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return {
    total_sessions: total,
    completed_sessions: sessions.filter((s) => s.is_completed).length,
    total_focus_time_seconds: focus,
    total_focus_time_formatted: formatted(focus),
    average_focus_time_seconds: total ? Math.round(focus / total) : 0,
    average_focus_time_formatted: formatted(total ? focus / total : 0),
    total_distraction_attempts: attempts,
    average_distraction_attempts: total ? attempts / total : 0,
    average_quiz_score: questions ? correct / questions : 0,
    total_quiz_questions: questions,
    total_quiz_correct: correct,
    completion_rate: total
      ? sessions.filter((s) => s.is_completed).length / total
      : 0,
    streak_days: streak,
    most_blocked_apps: [...apps]
      .map(([app, count]) => ({ app, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    daily_breakdown: [...days.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  };
}
