import assert from 'node:assert/strict';
import test from 'node:test';
import { elapsedFocusSeconds } from '../src/utils/focusClock.ts';

test('background time advances the timer without interval callbacks', () => {
  assert.equal(elapsedFocusSeconds(1000, 60, 0, 0, 31000), 30);
});
test('warning freezes elapsed time across app restarts', () => {
  assert.equal(elapsedFocusSeconds(1000, 60, 0, 11000, 90000), 10);
});
test('resuming excludes all time spent waiting at warnings', () => {
  assert.equal(elapsedFocusSeconds(1000, 60, 20000, 0, 36000), 15);
});
test('a second warning accounts for previously completed pauses', () => {
  assert.equal(elapsedFocusSeconds(1000, 60, 20000, 46000, 200000), 25);
});
test('elapsed time stays within the session duration', () => {
  assert.equal(elapsedFocusSeconds(1000, 60, 0, 0, 100000), 60);
  assert.equal(elapsedFocusSeconds(1000, 60, 0, 0, 500), 0);
});
