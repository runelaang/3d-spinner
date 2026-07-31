import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ONE_SIDED_OPACITY,
  opacity,
  orderRenderItems,
} from "../dist/engines/little-3d-engine/renderer.js";
import { translation } from "../dist/engines/little-3d-engine/core/math.js";

const mesh = { vertices: [], faces: [] };

test("orderRenderItems: opaque instances precede back-to-front transparent instances", () => {
  const near = {
    mesh,
    model: translation(0, 0, 2),
    transparency: { mode: "one-sided" },
  };
  const opaqueA = { mesh, model: translation(0, 0, 100) };
  const far = {
    mesh,
    model: translation(0, 0, -4),
    transparency: { mode: "two-sided" },
  };
  const opaqueB = { mesh, model: translation(0, 0, -100) };

  assert.deepEqual(orderRenderItems([near, opaqueA, far, opaqueB], { x: 0, y: 0, z: 3 }), [
    opaqueA,
    opaqueB,
    far,
    near,
  ]);
});

test("opacity: applies defaults and clamps explicit values", () => {
  assert.equal(opacity(undefined, DEFAULT_ONE_SIDED_OPACITY), 0.35);
  assert.equal(opacity(-1, DEFAULT_ONE_SIDED_OPACITY), 0);
  assert.equal(opacity(2, DEFAULT_ONE_SIDED_OPACITY), 1);
});
