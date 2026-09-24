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

const triangle = "v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n";

test("parseObj uses the default palette when colors is empty", () => {
  const mesh = parseObj(triangle, { colors: [] });
  assert.equal(mesh.faces[0].color, "#3b82f6");
});

test("parseObj rejects a face index outside the defined vertices, naming the line", () => {
  assert.throws(() => parseObj("v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 99\n"), /OBJ line 4: .*"99"/);
  assert.throws(() => parseObj("v 0 0 0\nv 1 0 0\nv 0 1 0\nf 0 1 2\n"), /OBJ line 4/);
  assert.throws(() => parseObj("v 0 0 0\nv 1 0 0\nv 0 1 0\nf -4 -2 -1\n"), /OBJ line 4/);
  assert.throws(() => parseObj("v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 x\n"), /OBJ line 4/);
});

test("parseObj rejects non-numeric or missing vertex coordinates", () => {
  assert.throws(() => parseObj("# model\nv 0 abc 0\n"), /OBJ line 2: invalid vertex/);
  assert.throws(() => parseObj("v 0 0\n"), /OBJ line 1: .*x, y and z/);
});

test("parseObj rejects a face with fewer than three vertices", () => {
  assert.throws(() => parseObj("v 0 0 0\nv 1 0 0\nf 1 2\n"), /OBJ line 3: .*three vertices/);
});

test("parseObj still accepts relative indices, slash forms, and extra vertex values", () => {
  const mesh = parseObj("v 0 0 0 1\nv 1 0 0 1 0.5 0.5\nv 0 1 0\nf -3/1/1 2//2 3/3\n");
  assert.deepEqual(mesh.faces[0].indices, [0, 1, 2]);
});
