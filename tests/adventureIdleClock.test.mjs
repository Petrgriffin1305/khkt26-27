import assert from 'node:assert/strict';
import test from 'node:test';
import {
  localDayKey,
  millisecondsUntilNextLocalDay,
  shouldRefreshWorkspaceClock,
} from '../src/adventure/idleClock.ts';

test('idle workspace clock does not publish same-day polling ticks', () => {
  const day = localDayKey(new Date(2026, 9, 9, 12).getTime());
  assert.equal(shouldRefreshWorkspaceClock(false, day, day), false);
});

test('idle workspace clock publishes when the local date changes', () => {
  const before = localDayKey(new Date(2026, 9, 9, 23, 59, 59).getTime());
  const after = localDayKey(new Date(2026, 9, 10, 0, 0, 0).getTime());
  assert.notEqual(before, after);
  assert.equal(shouldRefreshWorkspaceClock(false, before, after), true);
});

test('active trip publishes every timer tick even on the same local date', () => {
  const day = localDayKey(new Date(2026, 9, 9, 12).getTime());
  assert.equal(shouldRefreshWorkspaceClock(true, day, day), true);
});

test('idle timer can wake exactly at the next local midnight', () => {
  const at = new Date(2026, 9, 9, 12, 30).getTime();
  const delay = millisecondsUntilNextLocalDay(at);
  assert.ok(delay > 0);
  assert.equal(localDayKey(at + delay - 1), localDayKey(at));
  assert.notEqual(localDayKey(at + delay), localDayKey(at));
});

test('same-day idle ticks cause zero clock state updates while active ticks remain live', () => {
  const start = new Date(2026, 9, 9, 12).getTime();
  const day = localDayKey(start);
  let idleUpdates = 0;
  let activeUpdates = 0;
  for (let second = 0; second < 60; second += 1) {
    const at = start + second * 1000;
    idleUpdates += Number(
      shouldRefreshWorkspaceClock(false, day, localDayKey(at)),
    );
    activeUpdates += Number(
      shouldRefreshWorkspaceClock(true, day, localDayKey(at)),
    );
  }
  assert.equal(idleUpdates, 0);
  assert.equal(activeUpdates, 60);
});
