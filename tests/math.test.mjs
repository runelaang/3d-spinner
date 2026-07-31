import { test } from "node:test";
import assert from "node:assert/strict";
import {
  identity,
  multiply,
  normalize,
  cross,
  dot,
  rotationX,
  rotationZ,
  transformAffine,
} from "../dist/engines/little-3d-engine/core/math.js";
import { approx } from "./helpers.mjs";

test("multiply: identity is the neutral element", () => {
  const m = rotationZ(0.73);
  assert.deepEqual(multiply(m, identity()), m);
  assert.deepEqual(multiply(identity(), m), m);
});

test("multiply: a rotation composed with its inverse is the identity", () => {
  const composed = multiply(rotationX(0.6), rotationX(-0.6));
  identity().forEach((expected, i) => approx(composed[i], expected, 1e-12));
});

test("normalize: unit length, and the zero vector is returned unchanged", () => {
  const n = normalize({ x: 3, y: 0, z: 4 });
  approx(Math.hypot(n.x, n.y, n.z), 1, 1e-12);
  assert.deepEqual(normalize({ x: 0, y: 0, z: 0 }), { x: 0, y: 0, z: 0 });
});

test("cross and dot follow the right-hand rule", () => {
  assert.deepEqual(cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }), { x: 0, y: 0, z: 1 });
  approx(dot({ x: 1, y: 2, z: 3 }, { x: 4, y: -5, z: 6 }), 4 - 10 + 18, 1e-12);
});

test("rotationZ(90 degrees) maps +X onto +Y (engine Rz convention)", () => {
  const rotated = transformAffine(rotationZ(Math.PI / 2), { x: 1, y: 0, z: 0 });
  approx(rotated.x, 0, 1e-12);
  approx(rotated.y, 1, 1e-12);
  approx(rotated.z, 0, 1e-12);
});
