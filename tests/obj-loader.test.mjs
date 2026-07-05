import { test } from "node:test";
import assert from "node:assert/strict";
import { parseObj } from "../dist/engines/little-3d-engine/loaders/obj.js";

const obj = `
v 0 0 0
v 1 0 0
v 0 1 0
usemtl Painted
f 1 2 3
usemtl Missing
f 1 3 2
`;

const mtl = `
newmtl Painted
Kd 0.1 0.5 1.0
`;

test("parseObj uses MTL Kd colors when enabled", () => {
  const mesh = parseObj(obj, { colors: ["#abcdef"], mtl, useMtlColors: true });
  assert.deepEqual(mesh.faces.map((face) => face.color), ["#1a80ff", "#abcdef"]);
});

test("parseObj falls back to first palette color for unknown MTL materials", () => {
  const mesh = parseObj(obj, { mtl, useMtlColors: true });
  assert.deepEqual(mesh.faces.map((face) => face.color), ["#1a80ff", "#3b82f6"]);
});

test("parseObj ignores MTL colors by default", () => {
  const mesh = parseObj(obj, { colors: ["#abcdef"], mtl });
  assert.deepEqual(mesh.faces.map((face) => face.color), ["#abcdef", "#abcdef"]);
});
