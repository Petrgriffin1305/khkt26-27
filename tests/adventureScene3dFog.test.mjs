import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { discoveryCloudLayout } from "../src/adventure/scene3d.ts";
import { cloudScaleAtProgress } from "../src/adventure/exploration.ts";

test("discovery clouds start inside the centered 3D camera view, clear of the train", () => {
  const aspect = 742 / 381;
  const height = 5.8;
  const camera = new THREE.OrthographicCamera(
    -height * aspect,
    height * aspect,
    height,
    -height,
    0.1,
    100,
  );
  camera.position.set(10, 8, 13);
  camera.lookAt(0.7, 1.4, 0);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  const project = (point) => new THREE.Vector3(...point).project(camera);
  const train = project([0.7, 2, 0]);

  assert.ok(discoveryCloudLayout.length >= 7);
  for (const cloud of discoveryCloudLayout) {
    const center = project([cloud.x, cloud.y, cloud.z]);
    assert.ok(center.x > -0.95 && center.x < 0.95, `cloud center x=${center.x}`);
    assert.ok(center.y > 0.15 && center.y < 0.95, `cloud center y=${center.y}`);
    assert.ok(Math.hypot(center.x - train.x, center.y - train.y) > 0.3);
    assert.equal(cloudScaleAtProgress(0.003, cloud.clearsAt, 0.16), 1);
  }
});

test("3D discovery clouds shrink monotonically and never return after clearing", () => {
  for (const cloud of discoveryCloudLayout) {
    const approach = 0.16;
    const before = cloudScaleAtProgress(cloud.clearsAt - approach / 2, cloud.clearsAt, approach);
    const cleared = cloudScaleAtProgress(cloud.clearsAt, cloud.clearsAt, approach);
    const later = cloudScaleAtProgress(Math.min(1, cloud.clearsAt + 0.2), cloud.clearsAt, approach);
    assert.ok(Math.abs(before - 0.5) < 1e-12);
    assert.equal(cleared, 0);
    assert.equal(later, 0);
  }
});
