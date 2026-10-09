import type { Journey } from "../../backend/src/adventure/domain";

export type ExplorationProgress = {
  station: number;
  fraction: number;
  remainingSeconds: number;
  thresholdSeconds: number;
};

/** Adds only finite, non-negative focus time to progress already saved on a journey. */
export function explorationProgress(
  journey: Pick<Journey, "station" | "remaining" | "threshold"> | undefined,
  draftSeconds = 0,
  targetSeconds?: number,
): ExplorationProgress {
  const stationValue = journey?.station;
  let station = Number.isSafeInteger(stationValue)
    ? Math.min(4, Math.max(0, Number(stationValue)))
    : 0;
  const rawThreshold = journey?.threshold ?? 1800;
  const thresholdIsValid = Number.isFinite(rawThreshold) && rawThreshold > 0;
  const thresholdSeconds = thresholdIsValid ? rawThreshold : 1800;
  let remainingSeconds = thresholdIsValid && Number.isFinite(journey?.remaining) &&
      Number(journey?.remaining) >= 0
    ? Number(journey?.remaining)
    : 0;

  const targetIsValid = targetSeconds === undefined ||
    (Number.isFinite(targetSeconds) && targetSeconds > 0);
  let validDraft = Number.isFinite(draftSeconds) && draftSeconds >= 0 && targetIsValid
    ? draftSeconds
    : 0;
  if (targetSeconds !== undefined && targetIsValid)
    validDraft = Math.min(validDraft, targetSeconds);
  if (!thresholdIsValid) validDraft = 0;
  remainingSeconds += validDraft;

  // Journey updates can pass several stops in one transaction; mirror that here.
  let crossings = 0;
  while (station < 4 && remainingSeconds >= thresholdSeconds && crossings < 4) {
    remainingSeconds -= thresholdSeconds;
    station++;
    crossings++;
  }
  return {
    station,
    fraction: station === 4
      ? 1
      : Math.min(1, Math.max(0, remainingSeconds / thresholdSeconds)),
    remainingSeconds,
    thresholdSeconds,
  };
}

/** Station index used for hiding unopened names on the map and station list. */
export function revealedStationIndex(
  journey: Pick<Journey, "station" | "remaining" | "threshold"> | undefined,
  draftSeconds = 0,
  targetSeconds?: number,
): number {
  return explorationProgress(journey, draftSeconds, targetSeconds).station;
}

/** Legacy radius for the 3D scene; its size still follows credited focus time. */
export function revealedRadius(seconds: number, target: number): number {
  const progress = Number.isFinite(seconds) && Number.isFinite(target) && target > 0
    ? Math.min(1, Math.max(0, seconds / target)) : 0;
  return 35 + 30 * progress;
}
