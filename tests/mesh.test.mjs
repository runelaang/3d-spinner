import { test } from "node:test";
import assert from "node:assert/strict";
import { centerAndScaleMesh } from "../dist/animations/object-flight.js";
import { approx } from "./helpers.mjs";

/** Axis-aligned bounds of a mesh's vertices. */
function bounds(mesh) {
  const lo = { x: Infinity, y: Infinity, z: Infinity };
  const hi = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const v of mesh.vertices) {
    lo.x = Math.min(lo.x, v.x); hi.x = Math.max(hi.x, v.x);
    lo.y = Math.min(lo.y, v.y); hi.y = Math.max(hi.y, v.y);
    lo.z = Math.min(lo.z, v.z); hi.z = Math.max(hi.z, v.z);
  }
  return { lo, hi };
}

/** A box mesh spanning lo..hi on each axis. Faces are irrelevant to centering. */
function boxMesh(lo, hi) {
  return {
    vertices: [
      { x: lo.x, y: lo.y, z: lo.z },
      { x: hi.x, y: hi.y, z: hi.z },
      { x: lo.x, y: hi.y, z: lo.z },
      { x: hi.x, y: lo.y, z: hi.z },
    ],
    faces: [],
  };
}

test("centerAndScaleMesh: centers on the origin and fits the largest axis to targetSize", () => {
  // Box from (0,0,0) to (2,4,6): largest extent is 6 along z.
  const mesh = boxMesh({ x: 0, y: 0, z: 0 }, { x: 2, y: 4, z: 6 });
  const out = centerAndScaleMesh(mesh, 1);
  const { lo, hi } = bounds(out);

  // Centered: midpoint of every axis sits at the origin.
  approx((lo.x + hi.x) / 2, 0, 1e-12, "x not centered");
  approx((lo.y + hi.y) / 2, 0, 1e-12, "y not centered");
  approx((lo.z + hi.z) / 2, 0, 1e-12, "z not centered");

  // Largest axis fits exactly targetSize; aspect ratio is preserved (uniform scale).
  approx(hi.z - lo.z, 1, 1e-12, "largest axis should equal targetSize");
  approx(hi.x - lo.x, 2 / 6, 1e-12, "uniform scale should preserve aspect ratio");
});

test("centerAndScaleMesh: does not mutate the input mesh", () => {
  const mesh = boxMesh({ x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 });
  const snapshot = JSON.stringify(mesh.vertices);
  centerAndScaleMesh(mesh, 5);
  assert.equal(JSON.stringify(mesh.vertices), snapshot);
});
