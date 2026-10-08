import type { Segment } from "../../backend/src/adventure/domain";
export type ActiveTrip = {
  id: string;
  owner: string;
  goal: string;
  topic: string;
  document: string;
  materials?: { name: string; size: number; type: string; status: string; message: string }[];
  target: number;
  groupId: string | null;
  started: number;
  lastAt: number;
  segments: Segment[];
  state: "focus" | "reconnecting" | "paused" | "pending";
  reconnect: number;
  observedAt?: number;
};
export const focused = (s: ActiveTrip) =>
  s.segments.reduce(
    (sum, v) =>
      sum +
      (v.kind === "focus" || v.kind === "material"
        ? (v.end - v.start) / 1000
        : 0),
    0,
  );
function append(
  s: ActiveTrip,
  start: number,
  end: number,
  kind: Segment["kind"],
) {
  if (end <= start) return;
  const tail = s.segments.at(-1);
  if (tail?.kind === kind && tail.end === start) tail.end = end;
  else s.segments.push({ start, end, kind });
}
export function tick(value: ActiveTrip, now: number): ActiveTrip {
  const s = structuredClone(value);
  if (now < s.lastAt) return { ...s, state: "pending" };
  if (s.state === "pending") return s;
  const start = s.lastAt;
  if (s.state === "paused") append(s, start, now, "break");
  else {
    const end = Math.min(
      now,
      start + Math.max(0, s.target - focused(s)) * 1000,
    );
    append(s, start, end, "focus");
    if (s.state === "reconnecting") {
      s.reconnect = Math.max(0, s.reconnect - (end - start) / 1000);
      if (!s.reconnect) s.state = "focus";
    }
  }
  s.lastAt = now;
  return s;
}
export function observe(s: ActiveTrip, now: number): ActiveTrip {
  const next = tick(s, now);
  return next.state === "paused" || next.state === "pending"
    ? next
    : { ...next, state: "pending", observedAt: now };
}
export function returnFromBackground(s: ActiveTrip, now: number): ActiveTrip {
  if (s.state !== "pending" || s.observedAt === undefined ||
      now < s.lastAt || now - s.observedAt > 3000) return s;
  return tick({ ...s, state: s.reconnect > 0 ? "reconnecting" : "focus", observedAt: undefined }, now);
}
export function leaveFocusView(s: ActiveTrip, now: number): ActiveTrip {
  return { ...observe(s, now), observedAt: undefined };
}
export function classify(
  value: ActiveTrip,
  kind: "material" | "distraction" | "break",
  now: number,
): ActiveTrip {
  const s = structuredClone(value);
  if (s.state !== "pending" || now < s.lastAt) return s;
  const end =
    kind === "material"
      ? Math.min(now, s.lastAt + Math.max(0, s.target - focused(s)) * 1000)
      : now;
  append(s, s.lastAt, end, kind);
  s.lastAt = now;
  s.observedAt = undefined;
  s.state =
    kind === "distraction"
      ? "reconnecting"
      : kind === "break"
        ? "paused"
        : s.reconnect > 0
          ? "reconnecting"
          : "focus";
  if (kind === "distraction") s.reconnect = 120;
  if (kind === "break") s.reconnect = 0;
  return s;
}
export function pause(s: ActiveTrip, now: number): ActiveTrip {
  return { ...tick(s, now), state: "paused", reconnect: 0 };
}
export function resume(s: ActiveTrip, now: number): ActiveTrip {
  return { ...tick(s, now), state: s.reconnect > 0 ? "reconnecting" : "focus" };
}
export function restore(s: ActiveTrip): ActiveTrip {
  return s.state === "paused" ? s : { ...s, state: "pending", observedAt: undefined };
}
