import { test } from "node:test";
import assert from "node:assert/strict";
import { shade, shadeColor } from "../dist/engines/little-3d-engine/core/light.js";

const Z = { x: 0, y: 0, z: 1 };
const NEG_Z = { x: 0, y: 0, z: -1 };

test("shade without a surface is flat Lambert on the base color", () => {
  // normal fully faces the light: brightness = ambient + intensity = 0.75.
  const light = { toLight: Z, intensity: 0.5, ambient: 0.25 };
  assert.deepEqual(shade(Z, "#804020", light), [96, 48, 24]);
});

test("shade adds an emissive term regardless of lighting", () => {
  // Face turned away from the light (lambert 0, ambient 0) stays lit by Ke.
  const light = { toLight: Z, intensity: 1, ambient: 0 };
  const surface = { material: { emissive: [1, 0, 0] } };
  assert.deepEqual(shade(NEG_Z, "#000000", light, surface), [255, 0, 0]);
});

test("shade adds a specular highlight when view and light align", () => {
  const light = { toLight: Z, intensity: 1, ambient: 0 };
  const surface = { material: { specular: [1, 1, 1], shininess: 32 }, viewDir: Z };
  assert.deepEqual(shade(Z, "#000000", light, surface), [255, 255, 255]);
});

test("specular is skipped without a view direction", () => {
  const light = { toLight: Z, intensity: 1, ambient: 0 };
  const surface = { material: { specular: [1, 1, 1], shininess: 32 } };
  assert.deepEqual(shade(Z, "#000000", light, surface), [0, 0, 0]);
});

test("specular is skipped on faces turned away from the light", () => {
  const light = { toLight: Z, intensity: 1, ambient: 0 };
  const surface = { material: { specular: [1, 1, 1], shininess: 32 }, viewDir: Z };
  assert.deepEqual(shade(NEG_Z, "#000000", light, surface), [0, 0, 0]);
});

test("higher shininess produces a tighter (dimmer) off-axis highlight", () => {
  const light = { toLight: Z, intensity: 1, ambient: 0 };
  // A view direction that puts the half-vector at 45deg from the normal.
  const viewDir = { x: 1, y: 0, z: 0 };
  const soft = shade(Z, "#000000", light, {
    material: { specular: [1, 1, 1], shininess: 1 },
    viewDir,
  });
  const sharp = shade(Z, "#000000", light, {
    material: { specular: [1, 1, 1], shininess: 64 },
    viewDir,
  });
  assert.ok(soft[0] > sharp[0], "low shininess should be brighter off-axis");
});

test("shadeColor formats the shaded channels as an rgb() string", () => {
  const light = { toLight: Z, intensity: 0.5, ambient: 0.25 };
  assert.equal(shadeColor(Z, "#804020", light), "rgb(96, 48, 24)");
});
