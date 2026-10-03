/** Persisted wall clock accounting survives backgrounding and app restarts. */
export function elapsedFocusSeconds(
  startedAt: number,
  targetSeconds: number,
  pausedDurationMs: number,
  focusPausedAt: number,
  now = Date.now(),
): number {
  const end = focusPausedAt || now;
  return Math.min(targetSeconds, Math.max(0,
    Math.floor((end - startedAt - pausedDurationMs) / 1000),
  ));
}
