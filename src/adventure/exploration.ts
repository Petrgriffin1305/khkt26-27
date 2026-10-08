/** A clear window around the train grows only with credited study time. */
export function revealedRadius(seconds: number, target: number): number {
  const progress = Number.isFinite(seconds) && Number.isFinite(target) && target > 0
    ? Math.min(1, Math.max(0, seconds / target)) : 0;
  return 35 + 30 * progress;
}
