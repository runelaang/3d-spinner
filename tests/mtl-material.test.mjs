import { test } from "node:test";
import assert from "node:assert/strict";
import { parseObj } from "../dist/engines/little-3d-engine/loaders/obj.js";

const obj = `
v 0 0 0
v 1 0 0
v 0 1 0
usemtl Shiny
f 1 2 3
usemtl Matte
f 1 3 2
`;

const mtl = `
newmtl Shiny
Kd 0.1 0.5 1.0
Ks 1 1 1
Ns 200
Ke 0.2 0 0

newmtl Matte
Kd 0.5 0.5 0.5
`;

test("parseObj attaches specular, shininess, and emissive from MTL", () => {
  const mesh = parseObj(obj, { mtl, useMtlColors: true });
  assert.deepEqual(mesh.faces[0].material, {
    specular: [1, 1, 1],
    shininess: 200,
    emissive: [0.2, 0, 0],
  });
});

test("parseObj leaves material undefined for a Kd-only material", () => {
  const mesh = parseObj(obj, { mtl, useMtlColors: true });
  assert.equal(mesh.faces[1].material, undefined);
  assert.equal(mesh.faces[1].color, "#808080");
});

test("parseObj clamps Ks/Ke channels into 0..1", () => {
  const clampMtl = `
newmtl Over
Kd 1 1 1
Ks 2 -1 0.5
Ke -0.5 3 0.25
`;
  const single = "v 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl Over\nf 1 2 3\n";
  const mesh = parseObj(single, { mtl: clampMtl, useMtlColors: true });
  assert.deepEqual(mesh.faces[0].material, {
    specular: [1, 0, 0.5],
    emissive: [0, 1, 0.25],
  });
});

test("parseObj ignores materials entirely when useMtlColors is off", () => {
  const mesh = parseObj(obj, { mtl });
  assert.equal(mesh.faces[0].material, undefined);
  assert.equal(mesh.faces[1].material, undefined);
});
