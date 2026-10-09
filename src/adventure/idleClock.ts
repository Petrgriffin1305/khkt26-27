export function localDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function millisecondsUntilNextLocalDay(timestamp: number): number {
  const nextDay = new Date(timestamp);
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(1, nextDay.getTime() - timestamp);
}

export function shouldRefreshWorkspaceClock(
  hasActiveTrip: boolean,
  previousLocalDay: string,
  currentLocalDay: string,
): boolean {
  return hasActiveTrip || previousLocalDay !== currentLocalDay;
}
