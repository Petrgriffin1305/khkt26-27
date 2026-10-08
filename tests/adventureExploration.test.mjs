import test from 'node:test';
import assert from 'node:assert/strict';
import { revealedRadius } from '../src/adventure/exploration.ts';

test('the unexplored scene is foggy from the start and clears with focused progress', () => {
  assert.equal(revealedRadius(0, 600), 35);
  assert.equal(revealedRadius(300, 600), 50);
  assert.equal(revealedRadius(600, 600), 65);
  assert.equal(revealedRadius(900, 600), 65);
});

test('fog cannot reveal extra scenery from negative or invalid time', () => {
  assert.equal(revealedRadius(-10, 600), 35);
  assert.equal(revealedRadius(300, 0), 35);
  assert.equal(revealedRadius(NaN, 600), 35);
});
