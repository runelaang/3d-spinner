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

const eulerCases = [
  [0.3, 0, 0],
  [0, 0.3, 0],
  [0, 0, 0.3],
  [0.4, -0.7, 1.2],
  [2.5, 0.1, -2.8],
  [1, Math.PI / 2, 0.5],
  [0.2, -Math.PI / 2, -0.9],
];

test("rotationFromEuler applies X, then Y, then Z (Rz * Ry * Rx)", async () => {
  const { rotationFromEuler, rotationY } =
    await import("../dist/engines/little-3d-engine/core/math.js");
  const expected = multiply(rotationZ(1.1), multiply(rotationY(-0.4), rotationX(0.7)));
  const actual = rotationFromEuler(0.7, -0.4, 1.1);
  expected.forEach((value, i) => approx(actual[i], value, 1e-12));
});

test("eulerFromRotation round-trips matrix -> euler -> matrix, including gimbal lock", async () => {
  const { rotationFromEuler, eulerFromRotation } =
    await import("../dist/engines/little-3d-engine/core/math.js");
  for (const [x, y, z] of eulerCases) {
    const matrix = rotationFromEuler(x, y, z);
    const euler = eulerFromRotation(matrix);
    const rebuilt = rotationFromEuler(euler.x, euler.y, euler.z);
    matrix.forEach((value, i) => approx(rebuilt[i], value, 1e-9, `case ${x},${y},${z} index ${i}`));
  }
});

test("eulerFromRotation returns single-axis angles unchanged", async () => {
  const { rotationFromEuler, eulerFromRotation } =
    await import("../dist/engines/little-3d-engine/core/math.js");
  approx(eulerFromRotation(rotationFromEuler(0.3, 0, 0)).x, 0.3, 1e-12);
  approx(eulerFromRotation(rotationFromEuler(0, 0.3, 0)).y, 0.3, 1e-12);
  approx(eulerFromRotation(rotationFromEuler(0, 0, 0.3)).z, 0.3, 1e-12);
});
