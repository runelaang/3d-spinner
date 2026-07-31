import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ONE_SIDED_OPACITY,
  chooseBackend,
  detectBackendSupport,
  opacity,
  orderRenderItems,
  resolveBackend,
  resolveTwoSidedOpacity,
} from "../dist/engines/little-3d-engine/renderer.js";
import { translation } from "../dist/engines/little-3d-engine/core/math.js";
import { approx } from "./helpers.mjs";

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

test("resolveTwoSidedOpacity: applies defaults and derives shorthand back opacity", () => {
  assert.deepEqual(resolveTwoSidedOpacity({ mode: "two-sided" }), {
    front: 0.56,
    back: 0.84,
  });
  const shorthand = resolveTwoSidedOpacity({ mode: "two-sided", opacity: 0.6 });
  assert.equal(shorthand.front, 0.6);
  approx(shorthand.back, 0.4);
  assert.deepEqual(
    resolveTwoSidedOpacity({
      mode: "two-sided",
      opacity: 0.6,
      frontOpacity: 0.9,
      backOpacity: 0.2,
    }),
    { front: 0.9, back: 0.2 },
  );
});

test("chooseBackend: prefers WebGPU, then WebGL, then Canvas 2D", () => {
  assert.equal(chooseBackend({ webgpu: true, webgl: true }), "webgpu");
  assert.equal(chooseBackend({ webgpu: true, webgl: false }), "webgpu");
  assert.equal(chooseBackend({ webgpu: false, webgl: true }), "webgl");
  assert.equal(chooseBackend({ webgpu: false, webgl: false }), "canvas2d");
});

test("resolveBackend: passes explicit backends through untouched", async () => {
  assert.equal(await resolveBackend("canvas2d"), "canvas2d");
  assert.equal(await resolveBackend("webgl"), "webgl");
  assert.equal(await resolveBackend("webgpu"), "webgpu");
});

test("detectBackendSupport: reports no hardware backends without a browser", async () => {
  assert.deepEqual(await detectBackendSupport(), { webgpu: false, webgl: false });
});

test("resolveBackend: auto falls back to Canvas 2D when nothing is supported", async () => {
  assert.equal(await resolveBackend("auto"), "canvas2d");
});
