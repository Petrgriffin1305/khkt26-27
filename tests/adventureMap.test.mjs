import test from "node:test";
import assert from "node:assert/strict";
import { mapGeometry, stopIndices } from "../src/adventure/mapGeometry.ts";
import { studyTopics } from "../backend/src/adventure/topics.ts";
import { extraQuizBank } from "../backend/prisma/extraQuizBank.ts";

test("six carriages fit behind the engine at the first station", () => {
  const geometry = mapGeometry();
  const start = geometry.distances[stopIndices[0]];
  for (let i = 0; i <= 6; i++) {
    const p = geometry.position(start - i * 49);
    assert.ok(p.x > 25 && p.x < 1100);
    assert.equal(p.y, 505);
  }
});
test("both branches visit the same five stations with different tracks", () => {
  const mountain = mapGeometry("mountain"),
    coast = mapGeometry("coast");
  assert.notEqual(mountain.path, coast.path);
  for (const index of stopIndices) {
    for (const geometry of [mountain, coast]) {
      const p = geometry.position(geometry.distances[index]);
      assert.deepEqual([p.x, p.y], mountain.route[index]);
      assert.ok(Number.isFinite(p.angle));
    }
  }
  assert.equal(mountain.position(-100).x, 35);
  assert.equal(coast.position(Infinity).x, 965);
});
test("every new study topic has three valid fallback quiz questions", () => {
  assert.equal(studyTopics.length, 12);
  assert.equal(new Set(studyTopics.map((t) => t.id)).size, 12);
  for (const topic of studyTopics.slice(3)) {
    assert.equal(extraQuizBank[topic.id].length, 3);
    for (const [question, options, answer, explanation] of extraQuizBank[
      topic.id
    ]) {
      assert.ok(question && explanation);
      assert.equal(options.length, 4);
      assert.ok(
        Number.isInteger(answer) && answer >= 0 && answer < options.length,
      );
    }
  }
});
