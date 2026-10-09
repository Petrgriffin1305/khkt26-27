import test from 'node:test';
import assert from 'node:assert/strict';
import { explorationProgress, revealedRadius, revealedStationIndex } from '../src/adventure/exploration.ts';
import { mapGeometry, stopIndices } from '../src/adventure/mapGeometry.ts';

const journey = (values = {}) => ({ station: 0, remaining: 0, threshold: 100, ...values });

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

test('map exploration adds only valid focused draft seconds to durable journey progress', () => {
  assert.deepEqual(explorationProgress(journey(), 25, 60), {
    station: 0, fraction: 0.25, remainingSeconds: 25, thresholdSeconds: 100,
  });
  assert.equal(revealedStationIndex(journey({ remaining: 95 }), 10, 60), 1);
});

test('a single valid draft can reveal multiple stops and the whole route', () => {
  const progress = explorationProgress(journey({ station: 2, remaining: 50, threshold: 60 }), 80, 120);
  assert.deepEqual(progress, { station: 4, fraction: 1, remainingSeconds: 10, thresholdSeconds: 60 });
  assert.equal(revealedStationIndex(journey({ station: 4, remaining: 500 }), 999, 60), 4);
});

test('group thresholds use the journey threshold and draft time is capped by its target', () => {
  assert.deepEqual(explorationProgress(journey({ threshold: 5400, remaining: 0 }), 1800, 2400), {
    station: 0, fraction: 1 / 3, remainingSeconds: 1800, thresholdSeconds: 5400,
  });
  assert.deepEqual(explorationProgress(journey({ threshold: 100 }), 900, 25), {
    station: 0, fraction: 0.25, remainingSeconds: 25, thresholdSeconds: 100,
  });
});

test('the revealed train position follows the selected mountain or coast route', () => {
  const progress = explorationProgress(journey({ station: 2, remaining: 40, threshold: 100 }));
  const positionFor = (branch) => {
    const geometry = mapGeometry(branch);
    const distance = geometry.distances[stopIndices[progress.station]] +
      progress.fraction * (geometry.distances[stopIndices[progress.station + 1]] - geometry.distances[stopIndices[progress.station]]);
    const { x, y } = geometry.position(distance);
    return [x, y];
  };
  assert.notDeepEqual(positionFor('mountain'), positionFor('coast'));
  assert.deepEqual(mapGeometry('mountain').position(mapGeometry('mountain').total), { x: 965, y: 320, angle: 0 });
  assert.deepEqual(mapGeometry('coast').position(mapGeometry('coast').total), { x: 965, y: 320, angle: 0 });
});

test('invalid progress fields and away/non-finite drafts do not unlock unexplored map', () => {
  assert.deepEqual(explorationProgress(journey({ station: -5, remaining: Infinity, threshold: 0 }), Infinity, 0), {
    station: 0, fraction: 0, remainingSeconds: 0, thresholdSeconds: 1800,
  });
  assert.deepEqual(explorationProgress(journey({ station: 1, remaining: NaN, threshold: 60 }), -10, 60), {
    station: 1, fraction: 0, remainingSeconds: 0, thresholdSeconds: 60,
  });
});
